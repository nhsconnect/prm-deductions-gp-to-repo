import { runWithinTransaction } from './helper';
import ModelFactory from '../../models';
import { modelName } from '../../models/deduction-request';
import { logInfo } from '../../middleware/logging';

const DeductionRequest = ModelFactory.getByName(modelName);

export const getDeductionRequestByConversationId = conversationId => {
  return DeductionRequest.findByPk(conversationId);
};

export const updateDeductionRequestStatus = async (conversationId, status) => {
  await runWithinTransaction(async transaction => {
    return await DeductionRequest.update(
      { status },
      {
        where: { conversation_id: conversationId },
        transaction
      }
    );
  });
  logInfo(`Successfully updated deduction request status to: ${status}`);
};
