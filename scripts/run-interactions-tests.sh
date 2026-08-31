#!/bin/bash
set -e
echo "Preparing"

pnpm run build

echo "Interactions tests"
pnpm run e2e:interactions
