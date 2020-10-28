import ModelFactory from '../../models';

const DeductionRequest = ModelFactory.getByName('DeductionRequest');

export const getDeductionRequestByConversationId = conversationId => {
  return DeductionRequest.findByPk(conversationId).then(deductionRequest => ({
    nhsNumber: deductionRequest.nhs_number
  }));
};

export const updateDeductionRequestStatus = async (conversationId, status) => {
  await DeductionRequest.update({ status }, { where: { conversation_id: conversationId } });
};
