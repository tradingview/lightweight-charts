#!/bin/bash
set -e

if [ "$CMP_OUT_DIR" = "" ]; then
	echo "Env variable CMP_OUT_DIR must be set"
	exit 1
fi

echo "Checkout to merge-base and build..."

BUILD_SCRIPT="build"
TEST_FILE_MODE="development"

if [ "$PRODUCTION_BUILD" = "true" ]; then
	BUILD_SCRIPT="build:prod"
	TEST_FILE_MODE="production"
fi

HEAD_SHA1=$(git rev-parse HEAD)
git checkout $(git merge-base origin/master HEAD)

npm install
npm run $BUILD_SCRIPT
mv ./dist ./merge-base-dist

echo "Checkout to HEAD back and build..."

git checkout $HEAD_SHA1
npm install
npm run $BUILD_SCRIPT

echo "Graphics tests"
set +e
node ./tests/e2e/graphics/runner.js ./merge-base-dist/lightweight-charts.standalone.$TEST_FILE_MODE.js ./dist/lightweight-charts.standalone.$TEST_FILE_MODE.js
EXIT_CODE=$?
set -e

if [ $EXIT_CODE != 0 ]; then
	echo "Generate archive with screenshots"
	tar -czvf ./screenshots.tar.gz $CMP_OUT_DIR
	mv ./screenshots.tar.gz $CMP_OUT_DIR/screenshots.tar.gz
	exit $EXIT_CODE
fi
