#!/bin/bash
set -e
echo "Preparing"

pnpm build
pnpm --filter @bishopbot/lwc-toolkit --filter "@bishopbot/lwc-plugin-*" build

echo "Interactions tests"
pnpm e2e:interactions
