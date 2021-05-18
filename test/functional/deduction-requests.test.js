import axios from 'axios';
import adapter from 'axios/lib/adapters/http';

const WAIT_FOR_HTTP_CALL = 7000;
describe('End to end test of /deduction-requests/', () => {
  it(
    'should return a 201 from GP2GP Adaptor with a valid NHS number',
    () => {
      const nhsNumber = process.env.NHS_ENVIRONMENT === 'dev' ? '9692842339' : '9692295621';

      return expect(
        axios.post(
          `${process.env.SERVICE_URL}/deduction-requests/`,
          { nhsNumber },
          {
            headers: {
              Authorization: process.env.AUTHORIZATION_KEYS
            },
            adapter
          }
        )
      ).resolves.toEqual(
        expect.objectContaining({
          status: 201
        })
      );
    },
    WAIT_FOR_HTTP_CALL
  );
});
