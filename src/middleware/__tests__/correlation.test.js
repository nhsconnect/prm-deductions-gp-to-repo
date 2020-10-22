jest.mock('uuid', () => {
  return {
    v4: jest
      .fn(() => 'default-mocked-uuid')
      .mockImplementationOnce(() => 'mocked-uuid')
      .mockImplementationOnce(() => 'second-mocked-uuid')
  };
});

import httpContext from 'async-local-storage';
import axios from 'axios';
import { getCorrelationId, middleware } from '../correlation';
httpContext.enable();

describe('correlation middleware', () => {
  it('should set a different correlation id for each request', () => {
    const req = new Map();

    middleware(req, null, () => {});
    const firstCorrelationId = getCorrelationId();

    middleware(req, null, () => {});
    const secondCorrelationId = getCorrelationId();

    expect(firstCorrelationId).not.toEqual(secondCorrelationId);
  });

  it('should use the correlation id from the request header if it exists', () => {
    const req = new Map([['X-Correlation-ID', 'some-correlation-id']]);

    middleware(req, null, () => {});
    expect(getCorrelationId()).toEqual('some-correlation-id');
  });

  it('should add the correlation id to all outbound requests', () => {
    const req = new Map([['X-Correlation-ID', 'some-correlation-id']]);

    middleware(req, null, () => {});

    expect(axios.defaults.headers.common['X-Correlation-ID']).toEqual('some-correlation-id');
  });
});
