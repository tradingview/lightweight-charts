#!/bin/bash
set -e
echo "Preparing"

pnpm build

echo "Coverage tests"
pnpm e2e:coverage
