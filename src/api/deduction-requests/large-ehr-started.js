import { body, param } from 'express-validator';
import {
  getDeductionRequestByConversationId,
  updateDeductionRequestStatus
} from '../../services/database/deduction-request-repository';
import { Status } from '../../models/deduction-request';
import { logError, logInfo } from '../../middleware/logging';
import { sendContinueRequest } from '../../services/gp2gp/send-continue-request';
import { setCurrentSpanAttributes } from '../../config/tracing';

export const largeEhrStartedValidationRules = [
  param('conversationId').isUUID().withMessage("'conversationId' provided is not of type UUID"),
  body('messageId').isUUID().withMessage("'messageId' provided is not of type UUID")
];

export const largeEhrStarted = async (req, res) => {
  const { conversationId } = req.params;
  const { messageId } = req.body;
  setCurrentSpanAttributes({ conversationId, messageId });

  try {
    const deductionRequest = await getDeductionRequestByConversationId(conversationId);
    if (deductionRequest === null) {
      res.sendStatus(404);
      return;
    }

    await updateDeductionRequestStatus(conversationId, Status.LARGE_EHR_STARTED);
    logInfo('Updated deduction request status to largeEhrStarted');

    await sendContinueRequest(conversationId, messageId, deductionRequest.odsCode);
    logInfo('Sent continue request');

    await updateDeductionRequestStatus(conversationId, Status.CONTINUE_MESSAGE_SENT);
    logInfo('Updated deduction request status to continueMessageSent');
    res.sendStatus(204);
  } catch (err) {
    logError('Error sending continue message', err);
    res.sendStatus(503);
  }
};
