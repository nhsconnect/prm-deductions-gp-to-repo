/**
 * @jest-environment node
 */
import request from 'supertest';
import app from '../../app';
import { initializeConfig } from '../../config';

jest.mock('../logging');
jest.mock('../../config');
initializeConfig.mockReturnValue({
  nhsNumberPrefix: '000',
  url: 'url',
  consumerApiKeys: { API_KEY: 'correct-key' }
});

// In all other unit tests we want to pass through all of this logic and should therefore call jest.mock
// jest.mock('../auth') will call the manual mock in __mocks__ automatically
describe('auth', () => {
  describe('authenticated successfully', () => {
    it('should return HTTP 200 when correctly authenticated', done => {
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

  describe('incorrect Authorisation header value provided ', () => {
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
});
