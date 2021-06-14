/**
 * @jest-environment node
 */
import request from 'supertest';
import app from '../../app';
import { initializeConfig } from '../../config';
import { logInfo, logWarning } from '../logging';
import { sendRetrievalRequest } from '../../services/gp2gp';
import { createDeductionRequest } from '../../services/database/create-deduction-request';
import { handleUpdateRequest } from '../../api/deduction-requests/handle-update-request';

jest.mock('../logging');
jest.mock('../../services/gp2gp/pds-retrieval-request');
jest.mock('../../services/database/create-deduction-request');
jest.mock('../../api/deduction-requests/handle-update-request');
jest.mock('../../config');

initializeConfig.mockReturnValue({
  nhsNumberPrefix: '000',
  consumerApiKeys: { TEST_USER: 'correct-key', DUPLICATE_TEST_USER: 'correct-key', USER_2: 'key_2' }
});

// In all other unit tests we want to pass through all of this logic and should therefore call jest.mock
// jest.mock('../auth') will call the manual mock in __mocks__ automatically
describe('auth', () => {
  describe('Authenticated successfully', () => {
    it('should return HTTP 201 when correctly authenticated', async () => {
      sendRetrievalRequest.mockResolvedValueOnce({ data: { data: 'Z345 ' } });
      createDeductionRequest.mockResolvedValueOnce({});
      handleUpdateRequest.mockResolvedValueOnce({});
      const res = await request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '0000000000' })
        .set('Authorization', 'correct-key');

      expect(res.statusCode).toBe(201);
    });
  });

  describe('consumerApiKeys environment variables not available', () => {
    it('should return 412 if consumerApiKeys is empty', async () => {
      initializeConfig.mockReturnValueOnce({ consumerApiKeys: {} });
      const errorMessage = {
        error: 'Server-side Authorization keys have not been set, cannot authenticate'
      };

      const res = await request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '0000000000' })
        .set('Authorization', 'correct-key');

      expect(res.statusCode).toBe(412);
      expect(res.body).toEqual(errorMessage);
    });
  });

  describe('Authorization header not provided', () => {
    it('should return HTTP 401 with an explicit error message when no authorization header provided', async () => {
      const errorMessage = {
        error: 'The request (/deduction-requests) requires a valid Authorization header to be set'
      };

      const res = await request(app).post('/deduction-requests/').send({ nhsNumber: '0000000000' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual(errorMessage);
    });
  });

  describe('Incorrect Authorisation header value provided ', () => {
    it('should return HTTP 403 with an explicit error message when authorization key is incorrect', async () => {
      const errorMessage = { error: 'Authorization header is provided but not valid' };

      const res = await request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '0000000000' })
        .set('Authorization', 'incorrect-key');

      expect(res.statusCode).toBe(403);
      expect(res.body).toEqual(errorMessage);
    });
  });

  describe('Auth logging', () => {
    it('should log consumer, method and url for correctly authenticated request', async () => {
      const conversationId = '34C86103-54BE-44DA-9CBE-E67F9D2FDF89';
      const logMessage = `Consumer: USER_2, Request: GET /deduction-requests/${conversationId}`;
      await request(app).get(`/deduction-requests/${conversationId}`).set('Authorization', 'key_2');

      expect(logInfo).toHaveBeenCalledWith(logMessage);
    });

    it('should log multiple consumers when they use the same key value', async () => {
      const logMessage =
        'Consumer: TEST_USER/DUPLICATE_TEST_USER, Request: POST /deduction-requests/';
      await request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '0000000000' })
        .set('Authorization', 'correct-key');

      expect(logInfo).toHaveBeenCalledWith(logMessage);
    });

    it('should log the method, url and partial api key when a request is unsuccessful', async () => {
      const logMessage = 'Unsuccessful Request: POST /deduction-requests/, API Key: ******key';
      await request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '0000000000' })
        .set('Authorization', 'incorrect-key');

      expect(logWarning).toHaveBeenCalledWith(logMessage);
    });
  });
});
