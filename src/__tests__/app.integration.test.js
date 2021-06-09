import app from '../app';
import axios from 'axios';
import request from 'supertest';
import config from '../config';
import { logger } from '../config/logging';
import ModelFactory from '../models';
import { v4 as uuid } from 'uuid';
import { modelName, Status } from '../models/deduction-request';
import { transportSpy, expectStructuredLogToContain } from '../__builders__/logging-helper';

jest.mock('axios');

const retrievalResponse = {
  data: {
    serialChangeNumber: '123',
    patientPdsId: 'hello',
    nhsNumber: '1111111111',
    odsCode: 'B1234'
  }
};

const DeductionRequest = ModelFactory.getByName(modelName);

describe('app', () => {
  beforeEach(() => {
    logger.add(transportSpy);
    process.env.API_KEY_FOR_TEST = 'correct-key';
    axios.get.mockImplementation(() => Promise.resolve({ status: 200, data: retrievalResponse }));
    axios.patch.mockImplementation(() => Promise.resolve({ status: 204, data: {} }));
    axios.post.mockImplementation(() => Promise.resolve({ status: 204, data: {} }));
  });

  afterEach(() => {
    if (process.env.API_KEY_FOR_TEST) {
      delete process.env.API_KEY_FOR_TEST;
    }
    if (process.env.NHS_NUMBER_PREFIX) {
      delete process.env.NHS_NUMBER_PREFIX;
    }
  });

  afterAll(async () => {
    await DeductionRequest.sequelize.sync({ force: true });
    await ModelFactory.sequelize.close();
  });

  describe('GET /', () => {
    it('should return a 404 status code', async () => {
      const res = await request(app).get('/');

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /any-text - an unspecified endpoint', () => {
    it('should return a 404 status code', async () => {
      const res = await request(app).get('/any-text');

      expect(res.statusCode).toBe(404);
    });
  });

  describe('Swagger Documentation', () => {
    it('GET /swagger - should return a 301 status code (redirect) and text/html content type response', async () => {
      const res = await request(app).get('/swagger');

      expect(res.statusCode).toBe(301);
      expect(res.header['content-type']).toBe('text/html; charset=UTF-8');
    });

    it('GET /swagger/index.html - should return a 200 status code and text/html content type response', async () => {
      const res = await request(app).get('/swagger/index.html');

      expect(res.statusCode).toBe(200);
      expect(res.header['content-type']).toBe('text/html; charset=UTF-8');
    });
  });

  describe('GET /health', () => {
    it('should return a 200 status code', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        version: '1',
        description: 'Health of GP to Repo service',
        node_env: config.nhsEnvironment,
        details: {
          database: { type: 'postgresql', connection: true, writable: true }
        }
      });
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    });
  });

  describe('POST /deduction-requests/', () => {
    it('should return a 201 status code and empty body for /deduction-requests/', async () => {
      process.env.NHS_NUMBER_PREFIX = '111';
      const res = await request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '1111111111' })
        .set('Authorization', 'correct-key');

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({});
      expectStructuredLogToContain(transportSpy, {
        conversationId: expect.anything(),
        traceId: expect.anything()
      });
    });

    it('should return a location header with lowercase conversationId', async () => {
      process.env.NHS_NUMBER_PREFIX = '111';
      const res = await request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '1111111111' })
        .set('Authorization', 'correct-key');

      expect(res.statusCode).toBe(201);
      expect(res.header.location).toMatch(
        /^.*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}).*$/
      );
      expectStructuredLogToContain(transportSpy, {
        conversationId: expect.anything(),
        traceId: expect.anything()
      });
    });

    it('should return a 503 status code with Errors for /deduction-requests/', async () => {
      process.env.NHS_NUMBER_PREFIX = '999';
      axios.patch.mockImplementation(() =>
        Promise.resolve({ status: 200, data: 'incorrect data!' })
      );

      const res = await request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '9999999999' })
        .set('Authorization', 'correct-key');

      expect(res.statusCode).toBe(503);
      expect(res.body).toEqual({ errors: 'Failed to Update: incorrect data!' });
      expectStructuredLogToContain(transportSpy, {
        conversationId: expect.anything(),
        traceId: expect.anything()
      });
    });

    it('should return a 422 status code without nhsNumber in body', async () => {
      const res = await request(app)
        .post('/deduction-requests/')
        .set('Authorization', 'correct-key');

      expect(res.statusCode).toBe(422);
      expectStructuredLogToContain(transportSpy, { traceId: expect.anything() });
    });
  });

  describe('GET /deduction-requests/:conversationId', () => {
    const conversationId = uuid();
    const expectedNhsNumber = '1234567890';
    const expectedStatus = Status.PDS_UPDATE_SENT;

    it('should return deduction request info', async () => {
      await DeductionRequest.create({
        conversationId,
        nhsNumber: expectedNhsNumber,
        status: expectedStatus,
        odsCode: 'something'
      });

      const res = await request(app)
        .get(`/deduction-requests/${conversationId}`)
        .set('Authorization', 'correct-key');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        data: {
          type: 'deduction-requests',
          id: conversationId,
          attributes: {
            nhsNumber: expectedNhsNumber,
            status: expectedStatus
          }
        }
      });
      expectStructuredLogToContain(transportSpy, { conversationId, traceId: expect.anything() });
    });

    it('should return 404 when deduction request cannot be found', async () => {
      const nonExistingConversationId = '58eff803-48f3-4a30-8189-632141bd823d';
      const res = await request(app)
        .get(`/deduction-requests/${nonExistingConversationId}`)
        .set('Authorization', 'correct-key');

      expect(res.statusCode).toBe(404);
      expectStructuredLogToContain(transportSpy, {
        conversationId: nonExistingConversationId,
        traceId: expect.anything()
      });
    });
  });

  describe('PATCH /deduction-requests/:conversationId/pds-updated', () => {
    const conversationId = uuid();
    const expectedNhsNumber = '1234567891';
    const expectedStatus = Status.PDS_UPDATE_SENT;
    const odsCode = 'B1234';

    it('should return 204 upon successful deduction request PDS update', async () => {
      await DeductionRequest.create({
        conversationId,
        nhsNumber: expectedNhsNumber,
        status: expectedStatus,
        odsCode
      });

      const res = await request(app)
        .patch(`/deduction-requests/${conversationId}/pds-updated`)
        .set('Authorization', 'correct-key');

      expect(res.statusCode).toBe(204);
      expect(res.body).toEqual({});
      expectStructuredLogToContain(transportSpy, { conversationId, traceId: expect.anything() });
    });
  });

  describe('PATCH /deduction-requests/:conversation-id/ehr-message-received', () => {
    const messageId = uuid();
    const conversationId = uuid();
    const expectedNhsNumber = '1234567891';
    const status = Status.EHR_REQUEST_SENT;
    const odsCode = 'B1234';

    it('should return 204 when EHR message is received', async () => {
      axios.get.mockImplementation(() => Promise.resolve({ status: 200 }));
      await DeductionRequest.create({
        conversationId,
        nhsNumber: expectedNhsNumber,
        status: status,
        odsCode
      });

      const res = await request(app)
        .patch(`/deduction-requests/${conversationId}/ehr-message-received`)
        .send({ messageId })
        .set('Authorization', 'correct-key');

      expect(res.statusCode).toBe(204);
      expect(res.body).toEqual({});
      expectStructuredLogToContain(transportSpy, {
        messageId,
        conversationId,
        traceId: expect.anything()
      });
    });
  });

  describe('PATCH /deduction-requests/:conversation-id/large-ehr-started', () => {
    const conversationId = uuid();
    const messageId = uuid();
    const expectedNhsNumber = '1234567898';
    const odsCode = 'B1234';

    it('should return 204 when continue message has been sent and status updated', async () => {
      axios.post.mockImplementation(() => Promise.resolve({ status: 204 }));
      await DeductionRequest.create({
        conversationId,
        nhsNumber: expectedNhsNumber,
        status: Status.EHR_REQUEST_SENT,
        odsCode
      });

      const res = await request(app)
        .patch(`/deduction-requests/${conversationId}/large-ehr-started`)
        .send({ messageId })
        .set('Authorization', 'correct-key');

      expect(res.status).toEqual(204);

      const statusRes = await request(app)
        .get(`/deduction-requests/${conversationId}`)
        .set('Authorization', 'correct-key');

      expect(statusRes.status).toEqual(200);
      expect(statusRes.body).toEqual({
        data: {
          type: 'deduction-requests',
          id: conversationId,
          attributes: {
            nhsNumber: '1234567898',
            status: Status.CONTINUE_MESSAGE_SENT
          }
        }
      });
      expectStructuredLogToContain(transportSpy, { conversationId, traceId: expect.anything() });
    });
  });
});
