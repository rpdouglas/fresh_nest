#!/usr/bin/env bash
# Admin visual harness (P3-E33) — local only. Needs Java 21 (Firestore emulator) and
# `npm ci` in functions/ (the seed uses its firebase-admin). Extra args go to Playwright,
# e.g. `npm run test:admin-visual -- --update-snapshots` or `-- --project=phone`.
set -euo pipefail
cd "$(dirname "$0")/.."
ARGS=$(printf ' %q' "$@")
npx -y firebase-tools@15 emulators:exec \
  --config ../../firebase.admin-visual.json --project freshnest-aa51e --only firestore,auth \
  "NODE_PATH=../../functions/node_modules node e2e-admin/seed.cjs && npx playwright test -c e2e-admin/playwright.config.ts${ARGS}"
