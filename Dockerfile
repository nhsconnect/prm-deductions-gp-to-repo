FROM node:14.17.1-alpine

RUN apk update && \
    apk add --no-cache bash tini postgresql-client jq && \
    rm -rf /var/cache/apk/*

RUN apk add --no-cache \
        python3 \
        py3-pip \
    && pip3 install --upgrade pip \
    && pip3 install \
        awscli \
    && rm -rf /var/cache/apk/*

COPY scripts/run-server.sh /usr/bin/run-gp-to-repo-server
COPY scripts/load-api-keys.sh /app/scripts/load-api-keys.sh

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
