import axios from 'axios';
import * as config from '../../../config';
import { sendUpdateRequest } from '../pds-update-request';
import { v4 as uuid } from 'uuid';

const { gp2gpUrl, gp2gpAuthKeys, repositoryOdsCode } = config.default;

jest.mock('../../../config/logging');
jest.mock('../../../middleware/logging');
jest.mock('axios');
jest.mock('uuid');
uuid.mockImplementation(() => 'mockConversationId');

const mockNhsNumber = '01234567890';
const serialChangeNumber = '13';
const pdsId = 'hello';

const axiosHeaders = {
  headers: {
    Authorization: gp2gpAuthKeys
  }
};

const axiosBody = {
  serialChangeNumber,
  pdsId,
  newOdsCode: repositoryOdsCode,
  conversationId: uuid()
};

describe('sendUpdateRequest', () => {
  it('should call axios with nhs number by default and return 204', () => {
    axios.patch.mockResolvedValue({ status: 204 });

    return sendUpdateRequest(serialChangeNumber, pdsId, mockNhsNumber, uuid()).then(response => {
      expect(response.status).toBe(204);
      expect(axios.patch).toBeCalledWith(
        `${gp2gpUrl}/patient-demographics/${mockNhsNumber}`,
        axiosBody,
        axiosHeaders
      );
    });
  });

  it('should call logError if there is an error with axios.patch request', () => {
    axios.patch.mockRejectedValue(new Error());

    return expect(
      sendUpdateRequest(serialChangeNumber, pdsId, mockNhsNumber, uuid())
    ).rejects.toThrowError(
      `PATCH ${gp2gpUrl}/patient-demographics/${mockNhsNumber} - Request failed`
    );
  });
});
