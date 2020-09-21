#!/bin/bash
set -e
echo "Preparing"

npm run build

echo "Coverage tests"
node ./tests/e2e/coverage/runner.js ./dist/lightweight-charts.standalone.development.js
