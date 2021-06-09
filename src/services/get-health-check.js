import { checkDbHealth } from './database/check-db-health';
import { logInfo } from '../middleware/logging';
import config from '../config';

export function getHealthCheck() {
  logInfo('Starting health check');

  return checkDbHealth().then(db => {
    logInfo('Database health check', { db });
    return {
      version: '1',
      description: 'Health of GP to Repo service',
      node_env: config.nhsEnvironment,
      details: {
        database: db
      }
    };
  });
}
