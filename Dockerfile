FROM node:12.14.0-alpine

RUN apk update && \
    apk add --no-cache bash tini postgresql-client && \
    rm -rf /var/cache/apk/*

# Migration script
COPY scripts/migrate-db.sh /usr/bin/run-gp-to-repo-server

ENV AUTHORIZATION_KEYS="auth-key-1" \
  GP_TO_REPO_SKIP_MIGRATION=false \
  NHS_ENVIRONMENT="" \
  DATABASE_USER="" \
  DATABASE_PASSWORD="" \
  DATABASE_NAME="" \
  DATABASE_HOST=""

WORKDIR /app

COPY package*.json  /app/
COPY build/         /app/build
COPY database/      /app/database
COPY build/config/database.js /app/src/config/
COPY .sequelizerc   /app/

RUN npm install

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/usr/bin/run-gp-to-repo-server"]
