import { v4 as uuid } from 'uuid';
import { createDeductionRequest } from '../create-deduction-request';
import { runWithinTransaction } from '../helper';
import { logInfo, logError } from '../../../middleware/logging';
import ModelFactory from '../../../models';
import { modelName, Status } from '../../../models/deduction-request';

jest.mock('../../../middleware/logging');

describe('createDeductionRequest', () => {
  const nhsNumber = '1234567890';
  const odsCode = 'B1234';
  const DeductionRequest = ModelFactory.getByName(modelName);

  afterAll(async () => {
    await DeductionRequest.sequelize.sync({ force: true });
    await ModelFactory.sequelize.close();
  });

  it('should call logInfo if data persisted correctly', () => {
    const conversationId = uuid();
    return createDeductionRequest(conversationId, nhsNumber, odsCode).then(() => {
      return expect(logInfo).toHaveBeenCalledWith('Deduction request has been stored');
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
    expect(deductionRequest.get().odsCode).toBe(odsCode);
    expect(deductionRequest.get().status).toBe(Status.STARTED);
  });

  it('should log errors when nhs number is invalid', () => {
    const conversationId = uuid();
    return createDeductionRequest(conversationId, '123', odsCode).catch(error => {
      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith('runWithinTransaction error', error);
      return expect(error.message).toContain('Validation len on nhsNumber failed');
    });
  });

  it('should log errors when conversationId is invalid', () => {
    return createDeductionRequest('invalid-conversation-id', nhsNumber, odsCode).catch(error => {
      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith('runWithinTransaction error', error);
      return expect(error.message).toContain(
        'invalid input syntax for type uuid: "invalid-conversation-id"'
      );
    });
  });
});
