FROM        node:24.12-trixie-slim

WORKDIR     /app

RUN         apt-get update \
            && apt-get install -y gettext-base \
            && npm install -g pnpm

COPY        ./ ./

RUN         pnpm install

ENV         BACKEND_URL=http://localhost:8080

ENTRYPOINT  ["/bin/sh", "-c"]

CMD         ["envsubst < ./next.config.mjs.template > ./next.config.mjs && pnpm dev"]

EXPOSE      3000/tcp
