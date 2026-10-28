#!/usr/bin/env bash
# Playwright persona flows (F5) against the Firebase emulators — no real project is touched.
# Needs Java 21+ (emulators) and `npm ci` in functions/ (the seed uses its firebase-admin).
# Extra args go to Playwright, e.g. `npm run test:e2e -- e2e/fsm.spec.ts` or `-- --headed`.
set -euo pipefail
cd "$(dirname "$0")/.."
ARGS=""
if [ $# -gt 0 ]; then ARGS=$(printf ' %q' "$@"); fi
npx -y firebase-tools@15 emulators:exec \
  --config ../../firebase.e2e.json --project freshnest-aa51e --only firestore,auth,storage \
  "NODE_PATH=../../functions/node_modules node e2e/harness/seed.cjs && npx playwright test${ARGS}"
