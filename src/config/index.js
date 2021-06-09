import sequelizeConfig from './database';

const portNumber = 3000;

export const initializeConfig = () => ({
  gpToRepoAuthKeys: process.env.AUTHORIZATION_KEYS,
  gp2gpUrl: process.env.GP2GP_URL,
  gp2gpAuthKeys: process.env.GP2GP_AUTHORIZATION_KEYS,
  ehrRepoUrl: process.env.EHR_REPO_URL,
  ehrRepoAuthKeys: process.env.EHR_REPO_AUTHORIZATION_KEYS,
  repositoryOdsCode: process.env.REPOSITORY_ODS_CODE,
  repositoryAsid: process.env.REPOSITORY_ASID,
  url: process.env.SERVICE_URL || `http://127.0.0.1:${portNumber}`,
  sequelize: sequelizeConfig,
  nhsEnvironment: process.env.NHS_ENVIRONMENT || 'local',
  nhsNumberPrefix: process.env.NHS_NUMBER_PREFIX,
  consumerApiKeys: loadConsumerKeys()
});

const loadConsumerKeys = () => {
  const consumerObjectKeys = {};
  Object.keys(process.env).forEach(envVarName => {
    if (envVarName.startsWith('API_KEY_FOR_')) {
      const consumerName = envVarName.split('API_KEY_FOR_')[1];
      consumerObjectKeys[consumerName] = process.env[envVarName];
    }
  });
  return consumerObjectKeys;
};

export default initializeConfig();
export { portNumber };
