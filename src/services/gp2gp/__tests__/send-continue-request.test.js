import nock from 'nock';
import { v4 as uuid } from 'uuid';
import { sendContinueRequest } from '../send-continue-request';
import { logError, logInfo } from '../../../middleware/logging';
import { initializeConfig } from '../../../config';

jest.mock('../../../middleware/logging');
jest.mock('../../../config');

describe('sendContinueRequest', () => {
  const host = 'http://localhost';
  const endpoint = `/health-record-requests/continue-message`;
  initializeConfig.mockReturnValue({
    gp2gpUrl: host,
    gp2gpAuthKeys: 'auth-key-1'
  });

  const conversationId = uuid();
  const ehrExtractMessageId = uuid();
  const gpOdsCode = 'B12345';

  const requestBody = {
    conversationId,
    gpOdsCode,
    ehrExtractMessageId
  };

  it('should make a POST request to send continue message to GP practice', async () => {
    const continueScope = nock(host).post(endpoint, requestBody).reply(204);
    await sendContinueRequest(conversationId, ehrExtractMessageId, gpOdsCode);
    expect(continueScope.isDone()).toBe(true);
    expect(logInfo).toHaveBeenCalledWith('Successfully sent continue message');
  });

  it('should log and throw error when axios returns 503', async () => {
    const expectedError = new Error('Request failed with status code 503');
    nock(host).post(endpoint, requestBody).reply(503);

    let error = null;
    try {
      await sendContinueRequest(conversationId, ehrExtractMessageId, gpOdsCode);
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
    expect(logError).toHaveBeenCalledWith(`Failed to send continue request`, expectedError);
  });
});
