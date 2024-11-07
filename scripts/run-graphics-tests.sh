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

if [ -z "$COMPARE_BRANCH" ]; then
    # If COMPARE_BRANCH is not set, use the old behaviour
    echo "checking out merge-base with master"
    git checkout $(git merge-base origin/master HEAD)
else
    # If COMPARE_BRANCH is set, use the specified branch
    echo "Using latest commit on target branch: $COMPARE_BRANCH"
    git checkout origin/$COMPARE_BRANCH
fi

npm install
npm run $BUILD_SCRIPT
# Remove existing merge-base-dist if it exists
rm -rf ./merge-base-dist
mv ./dist ./merge-base-dist

if [ "$BRANCH_SPECIFIC_TEST" = "true" ]; then
	echo "Using BRANCH_SPECIFIC_TEST"
	echo "Running generate-golden-content"
	npx esno ./tests/e2e/graphics/generate-golden-content.ts ./golden_test_files
	export GOLDEN_TEST_CONTENT_PATH="./golden_test_files"
fi

echo "Checkout to HEAD back and build..."

git checkout $HEAD_SHA1
npm install
npm run $BUILD_SCRIPT

echo "Graphics tests"
set +e
npx esno ./tests/e2e/graphics/runner.ts ./merge-base-dist/lightweight-charts.standalone.$TEST_FILE_MODE.js ./dist/lightweight-charts.standalone.$TEST_FILE_MODE.js
EXIT_CODE=$?
set -e

if [ $EXIT_CODE != 0 ]; then
	echo "Generate archive with screenshots"
	tar -czvf ./screenshots.tar.gz $CMP_OUT_DIR
	mv ./screenshots.tar.gz $CMP_OUT_DIR/screenshots.tar.gz
	exit $EXIT_CODE
fi
