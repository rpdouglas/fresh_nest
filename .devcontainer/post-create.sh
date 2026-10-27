#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"
mkdir -p "$HOME/.local/bin"

echo "==> Ensuring Antigravity CLI (agy) is installed..."
if ! command -v agy >/dev/null 2>&1; then
  curl -fsSL https://antigravity.google/cli/install.sh | bash
else
  echo "    agy already installed: $(command -v agy)"
fi

echo "==> Ensuring Claude CLI (claude) is installed..."
if ! command -v claude >/dev/null 2>&1; then
  curl -fsSL https://claude.ai/install.sh | bash
else
  echo "    claude already installed: $(command -v claude)"
fi

echo "==> Verifying CLI installations..."
agy --version
claude --version

echo "==> Installing workspace npm dependencies..."
npm install
npm --prefix functions install
