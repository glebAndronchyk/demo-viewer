#!/bin/bash
set -e

if ! command -v bun &> /dev/null; then
  curl -fsSL https://bun.sh/install | bash
fi

export PATH="$HOME/.bun/bin:$PATH"
exec API_PORT=$PORT bun /home/site/wwwroot/backend/api/dist/index.js
