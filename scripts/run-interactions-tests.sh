#!/bin/bash
set -e
echo "Preparing"

pnpm build
pnpm --filter @tradingview/lwc-toolkit --filter "@tradingview/lwc-plugin-*" build

echo "Interactions tests"
pnpm e2e:interactions
