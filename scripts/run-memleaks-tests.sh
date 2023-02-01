#!/bin/bash
set -e
echo "Preparing"

# npm run build

echo "Memleaks tests"
if [[ ! -z "$RUNNING_ON_CI" ]]; then
    echo "Running on CI, therefore logging mem leaks output to artifact file"
    rm -rf tests/e2e/memleaks/.logs
    mkdir tests/e2e/memleaks/.logs
    node ./tests/e2e/memleaks/runner.js ./dist/lightweight-charts.standalone.development.js > ./tests/e2e/memleaks/.logs/memleaks.txt
else
    node ./tests/e2e/memleaks/runner.js ./dist/lightweight-charts.standalone.development.js
fi
