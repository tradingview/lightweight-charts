#!/bin/bash
set -e
echo "Preparing"

pnpm run build

echo "Coverage tests"
pnpm run e2e:coverage
