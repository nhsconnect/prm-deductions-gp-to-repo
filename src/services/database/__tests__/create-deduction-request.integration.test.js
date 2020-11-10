import { v4 as uuid } from 'uuid';
import { createDeductionRequest } from '../create-deduction-request';
import { runWithinTransaction } from '../helper';
import { updateLogEvent, updateLogEventWithError } from '../../../middleware/logging';
import ModelFactory from '../../../models';
import { modelName } from '../../../models/deduction-request';

jest.mock('../../../middleware/logging');

describe('createDeductionRequest', () => {
  const nhsNumber = '1234567890';
  const odsCode = 'B1234';
  const DeductionRequest = ModelFactory.getByName(modelName);

  afterAll(async () => {
    await DeductionRequest.sequelize.sync({ force: true });
    await ModelFactory.sequelize.close();
  });

  it('should call updateLogEvent if data persisted correctly', () => {
    const conversationId = uuid();
    return createDeductionRequest(conversationId, nhsNumber, odsCode).then(() => {
      expect(updateLogEvent).toHaveBeenCalledTimes(1);
      return expect(updateLogEvent).toHaveBeenCalledWith({
        status: 'Deduction request has been stored'
      });
    });
  });

  it('should create deduction request with correct values', async () => {
    const conversationId = uuid();
    await createDeductionRequest(conversationId, nhsNumber, odsCode);
    const deductionRequest = await runWithinTransaction(transaction =>
      DeductionRequest.findOne({
        where: {
          conversation_id: conversationId
        },
        transaction: transaction
      })
    );
    expect(deductionRequest).not.toBeNull();
    expect(deductionRequest.get().conversationId).toBe(conversationId);
    expect(deductionRequest.get().nhsNumber).toBe(nhsNumber);
  });

  it('should log errors when nhs number is invalid', () => {
    const conversationId = uuid();
    return createDeductionRequest(conversationId, '123', odsCode).catch(error => {
      expect(updateLogEventWithError).toHaveBeenCalledTimes(1);
      expect(updateLogEventWithError).toHaveBeenCalledWith(error);
      return expect(error.message).toContain('Validation len on nhsNumber failed');
    });
  });

  it('should log errors when conversationId is invalid', () => {
    return createDeductionRequest('invalid-conversation-id', nhsNumber, odsCode).catch(error => {
      expect(updateLogEventWithError).toHaveBeenCalledTimes(1);
      expect(updateLogEventWithError).toHaveBeenCalledWith(error);
      return expect(error.message).toContain(
        'invalid input syntax for type uuid: "invalid-conversation-id"'
      );
    });
  });
});
