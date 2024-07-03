#!/bin/bash
set -e
echo "Preparing"

npm run build

echo "Coverage tests"
npm run e2e:coverage
