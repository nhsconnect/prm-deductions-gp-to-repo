import { body } from 'express-validator';
import { v4 as uuid } from 'uuid';
import { sendRetrievalRequest } from '../../services/gp2gp';
import { handleUpdateRequest } from './handle-update-request';
import { logError, logInfo, logWarning } from '../../middleware/logging';
import { createDeductionRequest } from '../../services/database/create-deduction-request';
import { initializeConfig } from '../../config/index';
import { setCurrentSpanAttributes } from '../../config/tracing';

export const deductionRequestValidationRules = [
  body('nhsNumber').isNumeric().withMessage("'nhsNumber' provided is not numeric"),
  body('nhsNumber')
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters")
];

export const deductionRequest = async (req, res) => {
  const { url, nhsNumberPrefix, repositoryOdsCode } = initializeConfig();
  const { nhsNumber } = req.body;
  const conversationId = uuid();
  setCurrentSpanAttributes({ conversationId });

  try {
    if (!nhsNumberPrefix) {
      logWarning('Deduction request failed as no nhs number prefix has been set');
      res.sendStatus(404);
      return;
    }
    if (!nhsNumber.startsWith(nhsNumberPrefix)) {
      logWarning(
        `Deduction request failed as nhs number does not start with expected prefix: ${nhsNumberPrefix}`
      );
      res.sendStatus(404);
      return;
    }
    const pdsRetrievalResponse = await sendRetrievalRequest(nhsNumber);
    if (pdsRetrievalResponse.data.data.odsCode === repositoryOdsCode) {
      logWarning('Patient is already assigned to Repo - requesting Health Record from itself');
    }
    await createDeductionRequest(conversationId, nhsNumber, pdsRetrievalResponse.data.data.odsCode);
    await handleUpdateRequest(pdsRetrievalResponse, nhsNumber, conversationId);

    const statusEndpoint = `${url}/deduction-requests/${conversationId}`;

    logInfo('deductionRequest successful');
    res.set('Location', statusEndpoint).sendStatus(201);
  } catch (err) {
    logError('deductionRequest failed', { err });
    res.status(503).json({
      errors: err.message
    });
  }
};
