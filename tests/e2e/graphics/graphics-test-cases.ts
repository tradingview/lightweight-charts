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

import { generatePageContent } from './generate-test-cases';
import { getTestCases, TestCase } from './helpers/get-test-cases';
import { getBuildMode, getDevicePixelRatio, registerTestCases } from './helpers/register-test-cases';
import { Screenshoter } from './helpers/screenshoter';
import { removeEmptyDirsRecursive, rmRf } from './utils';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const goldenStandalonePathEnvKey = 'GOLDEN_STANDALONE_PATH';
const testStandalonePathEnvKey = 'TEST_STANDALONE_PATH';
const goldenTestContentPathEnvKey = 'GOLDEN_TEST_CONTENT_PATH';

const [devicePixelRatio, devicePixelRatioStr] = getDevicePixelRatio();

const testResultsOutDir = path.resolve(process.env.CMP_OUT_DIR || path.join(currentDirectory, '.gendata'));
const goldenStandalonePath: string = process.env[goldenStandalonePathEnvKey] || '';
const testStandalonePath: string = process.env[testStandalonePathEnvKey] || '';
const goldenContentDir: string = process.env[goldenTestContentPathEnvKey] || '';
const buildMode = getBuildMode();

void describe(`Graphics tests with devicePixelRatio=${devicePixelRatioStr} (${buildMode} mode)`, () => {
	const testCases = getTestCases();

	before(() => {
		rmRf(testResultsOutDir);
		fs.mkdirSync(testResultsOutDir, { recursive: true });

		expect(goldenStandalonePath, `path to golden standalone module must be passed via ${goldenStandalonePathEnvKey} env var`)
			.to.have.length.greaterThan(0);

		expect(testStandalonePath, `path to golden standalone module must be passed via ${testStandalonePathEnvKey} env var`)
			.to.have.length.greaterThan(0);
	});

	const screenshoter = new Screenshoter(Boolean(process.env.NO_SANDBOX), devicePixelRatio);

	const currentDprOutDir = path.join(testResultsOutDir, `devicePixelRatio=${devicePixelRatioStr}`);

	for (const groupName of Object.keys(testCases)) {
		const currentGroupOutDir = path.join(currentDprOutDir, groupName);

		if (groupName.length === 0) {
			registerGroup(testCases[groupName], screenshoter, currentGroupOutDir, groupName);
		} else {
			void describe(groupName, () => {
				registerGroup(testCases[groupName], screenshoter, currentGroupOutDir, groupName);
			});
		}
	}

	after(async () => {
		await screenshoter.close();
		removeEmptyDirsRecursive(testResultsOutDir);
	});
});

function registerGroup(testCases: TestCase[], screenshoter: Screenshoter, outDir: string, groupName: string): void {
	function getGoldenContent(testCase: TestCase): string | null {
		if (goldenContentDir) {
			try {
				const content = fs.readFileSync(
					path.join(goldenContentDir, groupName, testCase.name, 'test-content.html'),
					{ encoding: 'utf-8' }
				);
				return content.replace('PATH_TO_STANDALONE_MODULE', goldenStandalonePath);
			} catch {
				return null;
			}
		}
		return generatePageContent(
			goldenStandalonePath,
			testCase.caseContent,
			buildMode
		);
	}

	registerTestCases(testCases, screenshoter, outDir, {
		golden: getGoldenContent,
		test: (testCase: TestCase) => generatePageContent(testStandalonePath, testCase.caseContent, buildMode),
		skipMessage: goldenContentDir
			? 'Unable to loaded golden page content. It is likely this is a new test case.'
			: undefined,
	});
}
