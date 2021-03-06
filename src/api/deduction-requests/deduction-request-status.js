import { param } from 'express-validator';
import { logError } from '../../middleware/logging';
import { setCurrentSpanAttributes } from '../../config/tracing';
import { getDeductionRequestByConversationId } from '../../services/database/deduction-request-repository';

export const deductionRequestStatusValidationRules = [
  param('conversationId')
    .isUUID('4')
    .withMessage("'conversationId' provided is not of type UUIDv4"),
  param('conversationId').not().isEmpty().withMessage(`'conversationId' has not been provided`)
];

export const deductionRequestStatus = async (req, res) => {
  try {
    setCurrentSpanAttributes({ conversationId: req.params.conversationId });
    const requestStatus = await getDeductionRequestByConversationId(req.params.conversationId);

    if (requestStatus === null) return res.sendStatus(404);

    const { conversationId, nhsNumber, status } = requestStatus;

    const data = {
      data: {
        type: 'deduction-requests',
        id: conversationId,
        attributes: {
          nhsNumber,
          status
        }
      }
    };
    res.status(200).json(data);
  } catch (err) {
    logError('deductionRequestStatus failed', { err });
    res.status(503).json({
      errors: err.message
    });
  }
};
