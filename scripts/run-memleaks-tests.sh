#!/bin/bash
set -e
echo "Preparing"

# pnpm run build

echo "Memleaks tests"
if [[ ! -z "$RUNNING_ON_CI" ]]; then
    echo "Running on CI, therefore logging mem leaks output to artifact file"
    rm -rf tests/e2e/memleaks/.logs
    mkdir tests/e2e/memleaks/.logs
    pnpm run e2e:memleaks > ./tests/e2e/memleaks/.logs/memleaks.txt
else
    pnpm run e2e:memleaks
fi
