import axios from 'axios';
import adapter from 'axios/lib/adapters/http';

const WAIT_FOR_HTTP_CALL = 7000;
describe('End to end test of /deduction-requests/', () => {
  it(
    'should return a 201 from GP2GP Adaptor with a valid NHS number',
    () => {
      const testData = {
        dev: {
          nhsNumber: '9692842339'
        },
        test: {
          nhsNumber: '9692295621'
        },
        'pre-prod': {
          nhsNumber: '9693642120'
        }
      };
      const { nhsNumber } = testData[process.env.NHS_ENVIRONMENT];

      return expect(
        axios.post(
          `${process.env.SERVICE_URL}/deduction-requests/`,
          { nhsNumber },
          {
            headers: {
              Authorization: process.env.E2E_TEST_AUTHORIZATION_KEYS_FOR_GP_TO_REPO
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
