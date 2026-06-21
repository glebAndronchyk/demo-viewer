#!/bin/bash
set -e

if ! command -v bun &> /dev/null; then
  curl -fsSL https://bun.sh/install | bash
fi

export PATH="$HOME/.bun/bin:$PATH"
exec bunx serve -s . -l tcp://0.0.0.0:$PORT
