import {
  getDeductionRequestByConversationId,
  updateDeductionRequestStatus
} from '../../services/database/deduction-request-repository';
import { param, body } from 'express-validator';
import { checkEHRComplete } from '../../services/ehrRepo/ehr-details-request';
import { Status } from '../../models/deduction-request';
import { logInfo, logError } from '../../middleware/logging';
import { sendHealthRecordAcknowledgement } from '../../services/gp2gp/health-record-acknowledgement';
import { setCurrentSpanAttributes } from '../../config/tracing';

export const ehrMessageReceivedValidationRules = [
  param('conversationId')
    .isUUID('4')
    .withMessage("'conversationId' provided is not of type UUIDv4"),
  body('messageId').isUUID().withMessage("'messageId' provided is not of type UUID")
];

export const ehrMessageReceived = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageId } = req.body;
    setCurrentSpanAttributes({ conversationId, messageId });

    const deductionRequest = await getDeductionRequestByConversationId(conversationId);
    if (deductionRequest === null) {
      res.sendStatus(404);
      return;
    }
    const isEhrComplete = await checkEHRComplete(deductionRequest.nhsNumber, conversationId);
    if (isEhrComplete) {
      await updateDeductionRequestStatus(conversationId, Status.EHR_REQUEST_RECEIVED);
      logInfo('Updated deduction request status to EHR Received');
      await sendHealthRecordAcknowledgement(
        deductionRequest.nhsNumber,
        conversationId,
        deductionRequest.odsCode,
        messageId
      );
      logInfo('Ehr request received and acknowledgement sent');
    }
    res.sendStatus(204);
  } catch (err) {
    logError('ehrMessageReceived failed', { err });
    res.status(503).json({
      errors: err.message
    });
  }
};
