#!/bin/bash
set -e
echo "Preparing"

pnpm build

echo "Interactions tests"
pnpm e2e:interactions
