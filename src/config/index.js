import sequelizeConfig from './database';

const portNumber = 3000;

export const initializeConfig = () => ({
  nodeEnv: process.env.NODE_ENV,
  gpToRepoAuthKeys: process.env.AUTHORIZATION_KEYS,
  gp2gpUrl: process.env.GP2GP_URL,
  gp2gpAuthKeys: process.env.GP2GP_AUTHORIZATION_KEYS,
  ehrRepoUrl: process.env.EHR_REPO_URL,
  ehrRepoAuthKeys: process.env.EHR_REPO_AUTHORIZATION_KEYS,
  repositoryOdsCode: process.env.REPOSITORY_ODS_CODE,
  repositoryAsid: process.env.REPOSITORY_ASID,
  url: process.env.SERVICE_URL || `http://127.0.0.1:${portNumber}`,
  sequelize: sequelizeConfig,
  nhsEnvironment: process.env.NHS_ENVIRONMENT || 'local'
});

export default initializeConfig();
export { portNumber };
