import axios from 'axios';
import config from '../../../config';
import { sendHealthRecordRequest } from '../health-record-request';

jest.mock('axios');
jest.mock('../../../middleware/logging');

const oldConfig = config;
const nhsNumber = '1111111111';
const conversationId = '2d8ac681-0721-4d0c-8b76-5a26987829fb';
const odsCode = 'Z1234';
describe('sendHealthRecordRequest', () => {
  beforeEach(() => {
    axios.post.mockResolvedValue({ status: 200, body: {} });

    config.repositoryOdsCode = 'repo_ods_code';
    config.gp2gpAuthKeys = 'auth_keys';
  });

  afterEach(() => {
    config.repositoryOdsCode = oldConfig.repositoryOdsCode;
    config.gp2gpAuthKeys = oldConfig.gp2gpAuthKeys;
  });

  it('should call axios with nhs number and resolve', () => {
    return expect(sendHealthRecordRequest(nhsNumber, conversationId, odsCode)).resolves.toEqual(
      expect.objectContaining({ status: 200 })
    );
  });

  it('should fail to send the request when the require body parameters are not sent', () => {
    axios.post.mockRejectedValue({
      errors: [{ repositoryOdsCode: "'repositoryOdsCode' is not configured" }]
    });
    return expect(sendHealthRecordRequest(nhsNumber, conversationId, odsCode)).rejects.toEqual(
      expect.objectContaining({
        errors: expect.arrayContaining([
          { repositoryOdsCode: "'repositoryOdsCode' is not configured" }
        ])
      })
    );
  });

  it('should call axios post with body parameter practice ODS code', async () => {
    await sendHealthRecordRequest(nhsNumber, conversationId, odsCode);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        practiceOdsCode: odsCode
      }),
      expect.anything()
    );
  });

  it('should call axios post with authorization header', async () => {
    await sendHealthRecordRequest(nhsNumber, conversationId, odsCode);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: config.gp2gpAuthKeys
        })
      })
    );
  });
});
