FROM node:26.13.1-slim@sha256:abe7e5a82b61a8ef67b315b85497c9e65173387ccf2f4a029248184b8e020be5 AS node

FROM mcr.microsoft.com/playwright:v1.65.1-noble@sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579

ENV E2E_BASELINE=docker
ENV PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN=false

COPY --from=node /usr/local /usr/local

COPY --chmod=755 <<'EOF' /usr/local/bin/e2e
#!/bin/sh
set -eu

# Linux ではマウントした e2e/ の持ち主の権限で動かし、出力 (スクリーンショット・レポート) が root の持ち物にならないようにする
owner="$(stat -c '%u:%g' e2e)"

if [ "$(id -u)" = 0 ] && [ "${owner%:*}" != 0 ]; then
  export HOME=/tmp
  exec setpriv --reuid "${owner%:*}" --regid "${owner#*:}" --clear-groups \
    node_modules/.bin/playwright test -c e2e "$@"
fi

exec node_modules/.bin/playwright test -c e2e "$@"
EOF

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN npm install --global "$(node -p 'require("./package.json").packageManager')" \
  && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run e2e:build \
  && mkdir -p .astro .wrangler node_modules/.mf \
  && chmod -R a+rwX .astro .wrangler node_modules/.mf \
  && chmod a+rwX .

ENTRYPOINT ["e2e"]
