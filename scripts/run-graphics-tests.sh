#!/bin/bash
set -e

echo "Checkout to merge-base and build..."

git checkout $(git merge-base origin/master HEAD)
npm install
npm run build
mv ./dist ./merge-base-dist

echo "Checkout to HEAD back and build..."

git checkout $CI_COMMIT_SHA
npm install
npm run build

echo "Graphics tests"
node ./tests/e2e/graphics/runner.js ./merge-base-dist/lightweight-charts.standalone.development.js ./dist/lightweight-charts.standalone.development.js
