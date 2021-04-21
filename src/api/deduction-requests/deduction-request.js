import { body } from 'express-validator';
import { v4 as uuid } from 'uuid';
import { sendRetrievalRequest } from '../../services/gp2gp';
import { handleUpdateRequest } from './handle-update-request';
import { logError, logInfo, logWarning } from '../../middleware/logging';
import { createDeductionRequest } from '../../services/database/create-deduction-request';
import config from '../../config/index';
import { setCurrentSpanAttributes } from '../../config/tracing';

export const deductionRequestValidationRules = [
  body('nhsNumber').isNumeric().withMessage("'nhsNumber' provided is not numeric"),
  body('nhsNumber')
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters")
];

export const deductionRequest = async (req, res) => {
  const conversationId = uuid();
  setCurrentSpanAttributes({ conversationId });

  try {
    const pdsRetrievalResponse = await sendRetrievalRequest(req.body.nhsNumber);
    if (pdsRetrievalResponse.data.data.odsCode === config.repositoryOdsCode) {
      logWarning('Patient is already assigned to Repo - requesting Health Record from itself');
    }
    await createDeductionRequest(
      conversationId,
      req.body.nhsNumber,
      pdsRetrievalResponse.data.data.odsCode
    );
    await handleUpdateRequest(pdsRetrievalResponse, req.body.nhsNumber, conversationId);

    const statusEndpoint = `${config.url}/deduction-requests/${conversationId}`;

    logInfo('deductionRequest successful');
    res.set('Location', statusEndpoint).sendStatus(201);
  } catch (err) {
    logError('deductionRequest failed', { err });
    res.status(503).json({
      errors: err.message
    });
  }
};
