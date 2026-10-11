#!/usr/bin/env bash

# Clear ELECTRON_RUN_AS_NODE so Electron runs as GUI app
unset ELECTRON_RUN_AS_NODE

# Export paths so GUI launcher has full Node and NPM access even in minimal systemd scopes
export PATH="/home/abdullah/.nvm/versions/node/v24.18.0/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# Resolve canonical project directory
if [ -d "/home/abdullah/Desktop/Dev/handwriting converter" ]; then
  APP_DIR="/home/abdullah/Desktop/Dev/handwriting converter"
else
  REAL_SCRIPT="$(readlink -f "${BASH_SOURCE[0]}")"
  APP_DIR="$(cd "$(dirname "$REAL_SCRIPT")/.." && pwd)"
fi

cd "$APP_DIR"

# Ensure build artifacts exist
if [ ! -f "$APP_DIR/dist/electron/main/main.js" ] || [ ! -f "$APP_DIR/dist/renderer/index.html" ]; then
  npm run build
fi

exec "$APP_DIR/node_modules/.bin/electron" "$APP_DIR" --disable-features=Vulkan "$@"
