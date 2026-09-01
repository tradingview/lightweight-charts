#!/bin/bash
set -e

# This script switches the working tree between a base revision and HEAD.
# Everything is defined in functions that are parsed before the first
# `git checkout`, so the running script never depends on reading more of
# this file after the tree has changed underneath it.

# TODO(CLL-388): the npm fallbacks in the three helpers below are transitional.
# Remove them (keeping only the pnpm paths) once every revision this script
# compares against — master and the merge-bases of open PRs — contains
# pnpm-lock.yaml.
install_deps_for_revision() {
	# The base revision may predate the pnpm workspace migration and only
	# have package-lock.json, so the package manager is chosen per revision,
	# and node_modules is wiped when its layout was created by the other
	# package manager. The Puppeteer browser cache lives in ./.cache/puppeteer
	# (see .puppeteerrc.cjs) and survives these wipes.
	if [ -f pnpm-lock.yaml ]; then
		if [ -d node_modules ] && [ ! -f node_modules/.modules.yaml ]; then
			echo "Removing npm-created node_modules before pnpm install"
			rm -rf node_modules
		fi
		pnpm install --frozen-lockfile
	else
		if [ -d node_modules/.pnpm ]; then
			echo "Removing pnpm-created node_modules before npm install"
			rm -rf node_modules
		fi
		# The base revision is only built, never used to launch a browser,
		# so skip the browser download in puppeteer's postinstall.
		PUPPETEER_SKIP_DOWNLOAD=1 npm install
	fi
}

run_script() {
	if [ -f pnpm-lock.yaml ]; then
		pnpm run "$@"
	else
		npm run "$@"
	fi
}

exec_bin() {
	if [ -f pnpm-lock.yaml ]; then
		pnpm exec "$@"
	else
		npx "$@"
	fi
}

main() {
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

	install_deps_for_revision
	run_script $BUILD_SCRIPT
	# Remove existing merge-base-dist if it exists
	rm -rf ./merge-base-dist
	mv ./dist ./merge-base-dist

	if [ "$BRANCH_SPECIFIC_TEST" = "true" ]; then
		echo "Using BRANCH_SPECIFIC_TEST"
		echo "Running generate-golden-content"
		exec_bin esno ./tests/e2e/graphics/generate-golden-content.ts ./golden_test_files
		export GOLDEN_TEST_CONTENT_PATH="./golden_test_files"
	fi

	echo "Checkout to HEAD back and build..."

	git checkout $HEAD_SHA1
	install_deps_for_revision
	run_script $BUILD_SCRIPT

	echo "Graphics tests"
	set +e
	exec_bin esno ./tests/e2e/graphics/runner.ts ./merge-base-dist/lightweight-charts.standalone.$TEST_FILE_MODE.js ./dist/lightweight-charts.standalone.$TEST_FILE_MODE.js
	EXIT_CODE=$?
	set -e

	if [ $EXIT_CODE != 0 ]; then
		echo "Generate archive with screenshots"
		tar -czvf ./screenshots.tar.gz $CMP_OUT_DIR
		mv ./screenshots.tar.gz $CMP_OUT_DIR/screenshots.tar.gz
		exit $EXIT_CODE
	fi
}

main "$@"
