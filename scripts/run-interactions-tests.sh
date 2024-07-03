#!/bin/bash
set -e
echo "Preparing"

npm run build

echo "Interactions tests"
npm run e2e:interactions
