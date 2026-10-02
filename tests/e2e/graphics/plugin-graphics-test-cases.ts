/// <reference types="node" />
import { expect } from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
	after,
	before,
	describe,
} from 'node:test';
import { fileURLToPath } from 'node:url';

import { generatePluginPageContent } from './generate-plugin-test-cases';
import { findPluginStandalone, getPluginTestCases, PluginTestCasesGroup } from './helpers/get-plugin-test-cases';
import { TestCase } from './helpers/get-test-cases';
import { getBuildMode, getDevicePixelRatio, registerTestCases } from './helpers/register-test-cases';
import { Screenshoter } from './helpers/screenshoter';
import { removeEmptyDirsRecursive, rmRf } from './utils';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const goldenStandalonePathEnvKey = 'GOLDEN_STANDALONE_PATH';
const testStandalonePathEnvKey = 'TEST_STANDALONE_PATH';
const goldenPluginsDirEnvKey = 'GOLDEN_PLUGINS_DIR';
const testPluginsDirEnvKey = 'TEST_PLUGINS_DIR';

const [devicePixelRatio, devicePixelRatioStr] = getDevicePixelRatio();

const testResultsOutDir = path.resolve(process.env.CMP_OUT_DIR || path.join(currentDirectory, '.gendata'));
const goldenStandalonePath: string = process.env[goldenStandalonePathEnvKey] || '';
const testStandalonePath: string = process.env[testStandalonePathEnvKey] || '';
const goldenPluginsDir: string = process.env[goldenPluginsDirEnvKey] || '';
const testPluginsDir: string = process.env[testPluginsDirEnvKey] || '';
const buildMode = getBuildMode();

// The runner serves every file from one prefix; the plugin bundles sit next to the library ones.
function servedUrl(fileName: string): string {
	return goldenStandalonePath.slice(0, goldenStandalonePath.lastIndexOf('/') + 1) + fileName;
}

void describe(`Plugin graphics tests with devicePixelRatio=${devicePixelRatioStr} (${buildMode} mode)`, () => {
	const groups = getPluginTestCases();

	before(() => {
		rmRf(testResultsOutDir);
		fs.mkdirSync(testResultsOutDir, { recursive: true });

		for (const [value, key] of [
			[goldenStandalonePath, goldenStandalonePathEnvKey],
			[testStandalonePath, testStandalonePathEnvKey],
			[testPluginsDir, testPluginsDirEnvKey],
		]) {
			expect(value, `${key} env var must be set`).to.have.length.greaterThan(0);
		}
	});

	const screenshoter = new Screenshoter(Boolean(process.env.NO_SANDBOX), devicePixelRatio);

	const currentDprOutDir = path.join(testResultsOutDir, `devicePixelRatio=${devicePixelRatioStr}`);

	for (const group of groups) {
		void describe(group.folder, () => {
			registerGroup(group, screenshoter, path.join(currentDprOutDir, group.folder));
		});
	}

	after(async () => {
		await screenshoter.close();
		removeEmptyDirsRecursive(testResultsOutDir);
	});
});

function registerGroup(group: PluginTestCasesGroup, screenshoter: Screenshoter, outDir: string): void {
	const hasGolden = goldenPluginsDir.length > 0 && findPluginStandalone(goldenPluginsDir, group) !== null;
	const hasTest = findPluginStandalone(testPluginsDir, group) !== null;

	registerTestCases(group.testCases, screenshoter, outDir, {
		golden: (testCase: TestCase) => hasGolden
			? generatePluginPageContent(goldenStandalonePath, group.packageName, servedUrl(`golden-${group.folder}.js`), testCase.caseContent, buildMode)
			: null,
		test: (testCase: TestCase) => {
			expect(hasTest, `no standalone build of ${group.packageName} under ${testPluginsDir}; build the package first`).to.equal(true);
			return generatePluginPageContent(testStandalonePath, group.packageName, servedUrl(`test-${group.folder}.js`), testCase.caseContent, buildMode);
		},
		// A new package has no golden build; the case fails so that the reviewer
		// looks at its screenshot among the job's artifacts, as for any change.
		missingGolden: {
			action: 'fail',
			message: `No golden build of ${group.packageName}: a new package, or a merge-base that predates it.`,
		},
	});
}
