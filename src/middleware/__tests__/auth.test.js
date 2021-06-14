/**
 * @jest-environment node
 */
import request from 'supertest';
import app from '../../app';
import { initializeConfig } from '../../config';
import { logInfo, logWarning } from '../logging';

jest.mock('../logging');
jest.mock('../../config');
initializeConfig.mockReturnValue({
  nhsNumberPrefix: '000',
  url: 'url',
  consumerApiKeys: { TEST_USER: 'correct-key', DUPLICATE_TEST_USER: 'correct-key', USER_2: 'key_2' }
});

// In all other unit tests we want to pass through all of this logic and should therefore call jest.mock
// jest.mock('../auth') will call the manual mock in __mocks__ automatically
describe('auth', () => {
  describe('authenticated successfully', () => {
    it('should return HTTP 503 when correctly authenticated', done => {
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '0000000000' })
        .set('Authorization', 'correct-key')
        .expect(503)
        .end(done);
    });
  });

  describe('consumerApiKeys environment variables not available', () => {
    it('should return 412 if consumerApiKeys is empty', done => {
      initializeConfig.mockReturnValueOnce({
        nhsNumberPrefix: '000',
        url: 'url',
        consumerApiKeys: {}
      });
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '0000000000' })
        .set('Authorization', 'correct-key')
        .expect(412)
        .expect(res => {
          expect(res.body).toEqual(
            expect.objectContaining({
              error: 'Server-side Authorization keys have not been set, cannot authenticate'
            })
          );
        })
        .end(done);
    });
  });

  describe('Authorization header not provided', () => {
    it('should return HTTP 401 when no authorization header provided', done => {
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '0000000000' })
        .expect(401)
        .end(done);
    });

    it('should return an explicit error message in the body when no authorization header provided', done => {
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '0000000000' })
        .expect(res => {
          expect(res.body).toEqual(
            expect.objectContaining({
              error:
                'The request (/deduction-requests) requires a valid Authorization header to be set'
            })
          );
        })
        .end(done);
    });
  });

  describe('Incorrect Authorisation header value provided ', () => {
    it('should return HTTP 403 when authorization key is incorrect', done => {
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '0000000000' })
        .set('Authorization', 'incorrect-key')
        .expect(403)
        .end(done);
    });

    it('should return an explicit error message in the body when authorization key is incorrect', done => {
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '0000000000' })
        .set('Authorization', 'incorrect-key')
        .expect(res => {
          expect(res.body).toEqual(
            expect.objectContaining({
              error: 'Authorization header is provided but not valid'
            })
          );
        })
        .end(done);
    });
  });

  describe('Auth logging', () => {
    it('should log consumer, method and url for correctly authenticated request', done => {
      const conversationId = '34C86103-54BE-44DA-9CBE-E67F9D2FDF89';
      request(app)
        .get(`/deduction-requests/${conversationId}`)
        .set('Authorization', 'key_2')
        .expect(() => {
          expect(logInfo).toHaveBeenCalledWith(
            'Consumer: USER_2, Request: GET /deduction-requests/34C86103-54BE-44DA-9CBE-E67F9D2FDF89'
          );
        })
        .end(done);
    });

    it('should log multiple consumers when they use the same key value', done => {
      request(app)
        .post(`/deduction-requests/`)
        .set('Authorization', 'correct-key')
        .expect(() => {
          expect(logInfo).toHaveBeenCalledWith(
            'Consumer: TEST_USER/DUPLICATE_TEST_USER, Request: POST /deduction-requests/'
          );
        })
        .end(done);
    });

    it('should log the method, url and partial api key when a request is unsuccessful', done => {
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '0000000000' })
        .set('Authorization', 'incorrect-key')
        .expect(403)
        .expect(() => {
          expect(logWarning).toHaveBeenCalledWith(
            'Unsuccessful Request: POST /deduction-requests/, API Key: ******key'
          );
        })
        .end(done);
    });
  });
});
