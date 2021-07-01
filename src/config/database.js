require('dotenv').config();

const base_config = {
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  host: process.env.DATABASE_HOST,
  dialect: 'postgres',
  logging: false
};

if (process.env.USE_SSL_FOR_DB === 'true') {
  base_config.ssl = true;
  base_config.native = true;
  base_config.dialectOptions = { ssl: 'require' };
}

module.exports = base_config;
