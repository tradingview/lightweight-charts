#!/bin/bash
set -e
echo "Preparing"

npm run build

echo "Coverage tests"
node ./tests/e2e/coverage/runner.cjs ./dist/lightweight-charts.standalone.development.js
