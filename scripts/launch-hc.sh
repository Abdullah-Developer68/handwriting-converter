#!/usr/bin/env bash
set -e

# Export paths so GUI launcher has full node and npm access
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  \. "$NVM_DIR/nvm.sh"
fi
export PATH="/home/abdullah/.nvm/versions/node/v24.18.0/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# Ensure build artifacts exist
if [ ! -f "$APP_DIR/dist/electron/main/main.js" ] || [ ! -f "$APP_DIR/dist/renderer/index.html" ]; then
  npm run build
fi

unset ELECTRON_RUN_AS_NODE
exec "$APP_DIR/node_modules/.bin/electron" "$APP_DIR" "$@"
