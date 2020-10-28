import request from 'supertest';
import { when } from 'jest-when';
import { updateLogEvent } from '../../../middleware/logging';
import { sendRetrievalRequest, sendUpdateRequest } from '../../../services/gp2gp';
import app from '../../../app';
import { createDeductionRequest } from '../../../services/database/create-deduction-request';
import { v4 as uuid } from 'uuid';

jest.mock('../../../config/logging');
jest.mock('../../../middleware/logging');
jest.mock('../../../middleware/auth');
jest.mock('../../../services/gp2gp');
jest.mock('../../../services/database/create-deduction-request', () => ({
  createDeductionRequest: jest.fn().mockResolvedValue()
}));
jest.mock('uuid');

const retrievalResponse = {
  data: {
    serialChangeNumber: '123',
    patientPdsId: 'hello',
    nhsNumber: '1111111111',
    odsCode: 'B1234'
  }
};

const invalidRetrievalResponse = {
  data: {
    serialChangeNumber: '123',
    patientPdsId: 'hellno',
    nhsNumber: '1111111112',
    odsCode: 'C1234'
  }
};

function generateLogEvent(message) {
  return {
    status: 'validation-failed',
    validation: {
      errors: message,
      status: 'failed'
    }
  };
}

describe('POST /deduction-requests/', () => {
  beforeEach(() => {
    process.env.AUTHORIZATION_KEYS = 'correct-key';
    when(sendRetrievalRequest)
      .calledWith('1234567890')
      .mockImplementation(() => {
        throw new Error('Cannot retrieve patient');
      })
      .calledWith('1111111111')
      .mockResolvedValue({ status: 200, data: retrievalResponse })
      .calledWith('1111111112')
      .mockResolvedValue({ status: 200, data: invalidRetrievalResponse });

    when(sendUpdateRequest)
      .calledWith('123', 'hello', '1111111111')
      .mockResolvedValue({ status: 204 })
      .calledWith('123', 'hellno', '1111111112')
      .mockResolvedValue({ status: 503, data: 'could not update ods code on pds' });
  });

  it('should return a 204 if :nhsNumber is numeric and 10 digits and Authorization Header provided', done => {
    request(app)
      .post('/deduction-requests/')
      .send({ nhsNumber: '1111111111' })
      .expect(204)
      .end(done);
  });
  it('should call createDeductionRequest when patient is found in pds', done => {
    request(app)
      .post('/deduction-requests/')
      .send({ nhsNumber: '1111111111' })
      .expect(() => {
        expect(createDeductionRequest).toHaveBeenCalledWith(uuid(), '1111111111', 'B1234');
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
        expect(updateLogEvent).toHaveBeenCalledTimes(1);
        expect(updateLogEvent).toHaveBeenCalledWith(generateLogEvent(errorMessage));
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
        expect(updateLogEvent).toHaveBeenCalledTimes(1);
        expect(updateLogEvent).toHaveBeenCalledWith(generateLogEvent(errorMessage));
      })
      .end(done);
  });
  it('should return a 503 if sendRetrievalRequest throws an error', done => {
    request(app)
      .post('/deduction-requests/')
      .send({ nhsNumber: '1234567890' })
      .expect(res => {
        expect(res.status).toBe(503);
        expect(res.body.errors).toBe('Cannot retrieve patient');
      })
      .end(done);
  });
  it('should not call createDeductionRequest if patient not found in PDS', done => {
    request(app)
      .post('/deduction-requests/')
      .send({ nhsNumber: '1234567890' })
      .expect(() => {
        expect(createDeductionRequest).not.toHaveBeenCalled();
      })
      .end(done);
  });
  it('should return a 503 if patient is retrieved but not updated', done => {
    request(app)
      .post('/deduction-requests/')
      .send({ nhsNumber: '1111111112' })
      .expect(503)
      .expect(res => {
        expect(res.body.errors).toBe('Failed to Update: could not update ods code on pds');
      })
      .end(done);
  });
});