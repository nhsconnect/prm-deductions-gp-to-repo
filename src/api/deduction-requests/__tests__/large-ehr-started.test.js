import { v4 as uuid } from 'uuid';
import request from 'supertest';
import app from '../../../app';
import {
  getDeductionRequestByConversationId,
  updateDeductionRequestStatus
} from '../../../services/database/deduction-request-repository';
import { Status } from '../../../models/deduction-request';
import { logError, logInfo } from '../../../middleware/logging';
import { sendContinueRequest } from '../../../services/gp2gp/send-continue-request';

jest.mock('../../../middleware/auth');
jest.mock('../../../middleware/logging');
jest.mock('../../../services/database/deduction-request-repository');
jest.mock('../../../services/gp2gp/send-continue-request');

describe('PATCH /deduction-requests/:conversationId/large-ehr-started', () => {
  describe('success', () => {
    const conversationId = uuid();
    const messageId = uuid();
    const odsCode = 'B1234';

    beforeEach(() => {
      getDeductionRequestByConversationId.mockResolvedValueOnce({
        conversationId,
        odsCode,
        status: Status.EHR_REQUEST_SENT
      });
    });

    it('should update status to large ehr transfer started', async () => {
      await request(app)
        .patch(`/deduction-requests/${conversationId}/large-ehr-started`)
        .send({ messageId });

      expect(logInfo).toHaveBeenCalledWith('Updated deduction request status to largeEhrStarted');
      expect(updateDeductionRequestStatus).toHaveBeenCalledWith(
        conversationId,
        Status.LARGE_EHR_STARTED
      );
    });

    it('should send continue request', async () => {
      await request(app)
        .patch(`/deduction-requests/${conversationId}/large-ehr-started`)
        .send({ messageId });

      expect(sendContinueRequest).toHaveBeenCalledWith(conversationId, messageId, odsCode);
      expect(logInfo).toHaveBeenCalledWith('Sent continue request');
    });

    it('should update status to continue message sent and return 204', async () => {
      const res = await request(app)
        .patch(`/deduction-requests/${conversationId}/large-ehr-started`)
        .send({ messageId });

      expect(updateDeductionRequestStatus).toHaveBeenCalledWith(
        conversationId,
        Status.CONTINUE_MESSAGE_SENT
      );
      expect(logInfo).toHaveBeenCalledWith(
        'Updated deduction request status to continueMessageSent'
      );
      expect(res.status).toEqual(204);
    });
  });

  describe('failure', () => {
    const err = new Error('error');

    it('should return 404 if deduction request not found', async () => {
      getDeductionRequestByConversationId.mockResolvedValueOnce(null);
      const conversationId = uuid();
      const messageId = uuid();
      const res = await request(app)
        .patch(`/deduction-requests/${conversationId}/large-ehr-started`)
        .send({ messageId });

      expect(updateDeductionRequestStatus).not.toHaveBeenCalled();
      expect(res.status).toEqual(404);
    });

    it('should return a 503 when there is an error getting deduction request from database', async () => {
      getDeductionRequestByConversationId.mockRejectedValueOnce(err);
      const conversationId = uuid();
      const messageId = uuid();
      const res = await request(app)
        .patch(`/deduction-requests/${conversationId}/large-ehr-started`)
        .send({ messageId });

      expect(updateDeductionRequestStatus).not.toHaveBeenCalled();
      expect(res.status).toEqual(503);
      expect(logError).toHaveBeenCalledWith('Error sending continue message', err);
    });

    it('should return a 503 when there is an error updating the deduction request status', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      getDeductionRequestByConversationId.mockResolvedValueOnce({
        conversationId,
        status: Status.EHR_REQUEST_SENT
      });
      updateDeductionRequestStatus.mockRejectedValueOnce(err);

      const res = await request(app)
        .patch(`/deduction-requests/${conversationId}/large-ehr-started`)
        .send({ messageId });
      expect(res.status).toEqual(503);
      expect(logError).toHaveBeenCalledWith('Error sending continue message', err);
    });

    it('should return a 503 when there is an error sending the continue message', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const err = new Error('error');
      getDeductionRequestByConversationId.mockResolvedValueOnce({
        conversationId,
        status: Status.EHR_REQUEST_SENT
      });
      updateDeductionRequestStatus.mockResolvedValueOnce();
      sendContinueRequest.mockRejectedValueOnce(err);

      const res = await request(app)
        .patch(`/deduction-requests/${conversationId}/large-ehr-started`)
        .send({ messageId });

      expect(updateDeductionRequestStatus).not.toHaveBeenCalledWith(
        conversationId,
        Status.CONTINUE_MESSAGE_SENT
      );
      expect(res.status).toEqual(503);
      expect(logError).toHaveBeenCalledWith('Error sending continue message', err);
    });
  });

  describe('validation', () => {
    it('should return an error if :conversationId is not valid', async () => {
      const errorMessage = [{ conversationId: "'conversationId' provided is not of type UUID" }];
      const invalidConversationId = '12345';
      const messageId = uuid();

      const res = await request(app)
        .patch(`/deduction-requests/${invalidConversationId}/large-ehr-started`)
        .send({ messageId });

      expect(res.status).toEqual(422);
      expect(res.body).toEqual({
        errors: errorMessage
      });
    });

    it('should return an error if messageId is not valid', async () => {
      const errorMessage = [{ messageId: "'messageId' provided is not of type UUID" }];
      const invalidMessageId = '12345';
      const conversationId = uuid();

      const res = await request(app)
        .patch(`/deduction-requests/${conversationId}/large-ehr-started`)
        .send({ messageId: invalidMessageId });

      expect(res.status).toEqual(422);
      expect(res.body).toEqual({
        errors: errorMessage
      });
    });
  });
});
