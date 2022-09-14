#!/bin/bash
set -e
echo "Preparing"

npm run build

echo "Interactions tests"
node ./tests/e2e/interactions/runner.js ./dist/lightweight-charts.standalone.development.js
