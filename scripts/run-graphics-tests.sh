#!/bin/bash
set -e

# This script switches the working tree between a base revision and HEAD.
# Everything is defined in functions that are parsed before the first
# `git checkout`, so the running script never depends on reading more of
# this file after the tree has changed underneath it.

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

	pnpm install --frozen-lockfile
	pnpm $BUILD_SCRIPT
	# Remove existing merge-base-dist if it exists
	rm -rf ./merge-base-dist
	mv ./dist ./merge-base-dist

	if [ "$GRAPHICS_TEST_SUITE" = "plugins" ]; then
		build_plugins_golden
	fi

	if [ "$BRANCH_SPECIFIC_TEST" = "true" ]; then
		echo "Using BRANCH_SPECIFIC_TEST"
		echo "Running generate-golden-content"
		pnpm exec esno ./tests/e2e/graphics/generate-golden-content.ts ./golden_test_files
		export GOLDEN_TEST_CONTENT_PATH="./golden_test_files"
	fi

	echo "Checkout to HEAD back and build..."

	git checkout $HEAD_SHA1
	pnpm install --frozen-lockfile
	pnpm $BUILD_SCRIPT

	set +e
	if [ "$GRAPHICS_TEST_SUITE" = "plugins" ]; then
		echo "Plugin graphics tests"
		build_plugins
		pnpm exec esno ./tests/e2e/graphics/plugins-runner.ts ./merge-base-dist/lightweight-charts.standalone.$TEST_FILE_MODE.mjs ./dist/lightweight-charts.standalone.$TEST_FILE_MODE.mjs --golden-plugins-dir ./merge-base-plugins-dist --test-plugins-dir ./packages
	else
		echo "Graphics tests"
		pnpm exec esno ./tests/e2e/graphics/runner.ts ./merge-base-dist/lightweight-charts.standalone.$TEST_FILE_MODE.js ./dist/lightweight-charts.standalone.$TEST_FILE_MODE.js
	fi
	EXIT_CODE=$?
	set -e

	if [ $EXIT_CODE != 0 ]; then
		echo "Generate archive with screenshots"
		tar -czvf ./screenshots.tar.gz $CMP_OUT_DIR
		mv ./screenshots.tar.gz $CMP_OUT_DIR/screenshots.tar.gz
		exit $EXIT_CODE
	fi
}

# Builds the toolkit and every plugin package of the checked-out revision.
build_plugins() {
	pnpm --filter @tradingview/lwc-toolkit --filter "@tradingview/lwc-plugin-*" build
}

# Golden plugin builds: the merge-base revision's packages, kept next to the
# merge-base library build. A package that does not exist there (a new one)
# simply has no golden build, and its cases are reported as skipped.
build_plugins_golden() {
	rm -rf ./merge-base-plugins-dist ./packages/lwc-plugin-*/dist
	mkdir -p ./merge-base-plugins-dist
	set +e
	build_plugins
	set -e
	for pkg in ./packages/lwc-plugin-*/; do
		if [ -d "$pkg/dist" ]; then
			cp -R "$pkg/dist" "./merge-base-plugins-dist/$(basename "$pkg")"
		fi
	done
	# Stale outputs must not survive into the HEAD build.
	rm -rf ./packages/lwc-plugin-*/dist ./packages/lwc-plugin-*/typings
}

main "$@"
