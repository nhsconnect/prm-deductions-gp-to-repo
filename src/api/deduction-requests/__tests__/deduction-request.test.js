import request from 'supertest';
import { when } from 'jest-when';
import { v4 as uuid } from 'uuid';
import { logError, logWarning } from '../../../middleware/logging';
import { sendRetrievalRequest, sendUpdateRequest } from '../../../services/gp2gp';
import { createDeductionRequest } from '../../../services/database/create-deduction-request';
import { updateDeductionRequestStatus } from '../../../services/database/deduction-request-repository';
import { initializeConfig } from '../../../config';
import app from '../../../app';
import { Status } from '../../../models/deduction-request';

jest.mock('../../../config/logging');
jest.mock('../../../config');
jest.mock('../../../middleware/logging');
jest.mock('../../../middleware/auth');
jest.mock('../../../services/gp2gp');
jest.mock('../../../services/database/create-deduction-request');
jest.mock('../../../services/database/deduction-request-repository');
jest.mock('uuid');
const conversationId = 'c9b24d61-f5b0-4329-a731-e73064d89832';
uuid.mockImplementation(() => conversationId);

const successNhsNumber = '9691111111';
const errorNhsNumber = '9691111112';
const retrievalResponse = {
  data: {
    serialChangeNumber: '123',
    patientPdsId: 'hello',
    nhsNumber: successNhsNumber,
    odsCode: 'B1234'
  }
};
const invalidRetrievalResponse = {
  data: {
    serialChangeNumber: '123',
    patientPdsId: 'hellno',
    nhsNumber: errorNhsNumber,
    odsCode: 'C1234'
  }
};

describe('POST /deduction-requests/', () => {
  describe('Success and error cases', () => {
    beforeEach(() => {
      initializeConfig.mockReturnValue({ url: 'fake-url', nhsNumberPrefix: '969' });
      when(sendRetrievalRequest)
        .calledWith('9694567890')
        .mockImplementationOnce(() => {
          throw new Error('Cannot retrieve patient');
        })
        .calledWith(successNhsNumber)
        .mockResolvedValue({ status: 200, data: retrievalResponse })
        .calledWith(errorNhsNumber)
        .mockResolvedValue({ status: 200, data: invalidRetrievalResponse });

      when(sendUpdateRequest)
        .calledWith('123', 'hello', successNhsNumber, conversationId)
        .mockResolvedValue({ status: 204, data: { response: 'data' } })
        .calledWith('123', 'hellno', errorNhsNumber, conversationId)
        .mockResolvedValue({ status: 503, data: 'could not update ods code on pds' });
    });

    it('should return a 201 if :nhsNumber is numeric and 10 digits and Authorization Header provided', async done => {
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: successNhsNumber })
        .expect(201)
        .expect(res => {
          expect(res.header.location).toBe(
            `${initializeConfig().url}/deduction-requests/${conversationId}`
          );
        })
        .end(done);
    });
    it('should call createDeductionRequest when patient is found in pds', async done => {
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: successNhsNumber })
        .expect(() => {
          expect(createDeductionRequest).toHaveBeenCalledWith(
            conversationId,
            successNhsNumber,
            'B1234'
          );
        })
        .end(done);
    });
    it('should sendUpdateRequest with correct info when patient is found in PDS', done => {
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: successNhsNumber })
        .expect(() => {
          expect(sendUpdateRequest).toHaveBeenCalledWith(
            '123',
            'hello',
            successNhsNumber,
            conversationId
          );
        })
        .end(done);
    });
    it('should update the status of the deduction request to pds_update_sent when pds retrieval and update are successful', done => {
      const status = Status.PDS_UPDATE_SENT;
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: successNhsNumber })
        .expect(() => {
          expect(updateDeductionRequestStatus).toHaveBeenCalledWith(conversationId, status);
        })
        .end(done);
    });
    it('should not update the status of updateDeductionsRequest when pds retrieval and update are not successful', done => {
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: errorNhsNumber })
        .expect(() => {
          expect(updateDeductionRequestStatus).not.toHaveBeenCalled();
        })
        .end(done);
    });
    it('should return an error if :nhsNumber is less than 10 digits', done => {
      const errorMessage = [{ nhsNumber: "'nhsNumber' provided is not 10 characters" }];
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '111111' })
        .expect(422)
        .expect('Content-Type', /json/)
        .expect(res => {
          expect(res.body).toEqual({
            errors: errorMessage
          });
          expect(logError).toHaveBeenCalledTimes(1);
          expect(logError).toHaveBeenCalledWith('validation-failed', { errors: errorMessage });
        })
        .end(done);
    });
    it('should return an error if :nhsNumber is not numeric', done => {
      const errorMessage = [{ nhsNumber: "'nhsNumber' provided is not numeric" }];
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: 'xxxxxxxxxx' })
        .expect(422)
        .expect('Content-Type', /json/)
        .expect(res => {
          expect(res.body).toEqual({
            errors: errorMessage
          });
          expect(logError).toHaveBeenCalledTimes(1);
          expect(logError).toHaveBeenCalledWith('validation-failed', { errors: errorMessage });
        })
        .end(done);
    });
    it('should return a 503 if sendRetrievalRequest throws an error', done => {
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '9694567890' })
        .expect(res => {
          expect(res.status).toBe(503);
          expect(res.body.errors).toBe('Cannot retrieve patient');
        })
        .end(done);
    });
    it('should not call createDeductionRequest if patient not found in PDS', done => {
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: '9694567890' })
        .expect(() => {
          expect(createDeductionRequest).not.toHaveBeenCalled();
        })
        .end(done);
    });
    it('should return a 503 if patient is retrieved but not updated', done => {
      request(app)
        .post('/deduction-requests/')
        .send({ nhsNumber: errorNhsNumber })
        .expect(503)
        .expect(res => {
          expect(res.body.errors).toBe('Failed to Update: could not update ods code on pds');
        })
        .end(done);
    });
  });

  describe('NHS Number prefix checks', () => {
    it('should not allow a deduction request and return 404 when nhs number prefix is empty', async () => {
      initializeConfig.mockReturnValueOnce({ nhsNumberPrefix: '' });
      const res = await request(app).post('/deduction-requests/').send({ nhsNumber: '1234567891' });
      expect(res.status).toBe(422);
      expect(logWarning).toHaveBeenCalledWith(
        'Deduction request failed as no nhs number prefix env variable has been set'
      );
    });

    it('should not allow a deduction request and return 404 when nhs number prefix is undefined', async () => {
      initializeConfig.mockReturnValueOnce({ url: 'fake-url' });
      const res = await request(app).post('/deduction-requests/').send({ nhsNumber: '1234567891' });
      expect(res.status).toBe(422);
      expect(logWarning).toHaveBeenCalledWith(
        'Deduction request failed as no nhs number prefix env variable has been set'
      );
    });

    it('should not allow a deduction request when the nhs number does not start with the expected prefix', async () => {
      initializeConfig.mockReturnValueOnce({ nhsNumberPrefix: '999' });
      const res = await request(app).post('/deduction-requests/').send({ nhsNumber: '1234567891' });
      expect(res.status).toBe(422);
      expect(logWarning).toHaveBeenCalledWith(
        'Deduction request failed as nhs number does not start with expected prefix: 999'
      );
    });

    it('should allow a deduction request when the nhs number starts with the expected prefix', async () => {
      initializeConfig.mockReturnValueOnce({ nhsNumberPrefix: '999' });
      sendRetrievalRequest.mockResolvedValue({ status: 200, data: retrievalResponse });
      sendUpdateRequest.mockResolvedValue({ status: 204, data: { response: 'data' } });
      const res = await request(app).post('/deduction-requests/').send({ nhsNumber: '9994567891' });
      expect(res.status).toBe(201);
    });
  });
});
