/// <reference types="node" />
import { expect } from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
	after,
	before,
	describe,
	it,
} from 'node:test';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

import { retryTest } from '../helpers/retry-tests';

import { generatePageContent } from './generate-test-cases';
import { compareScreenshots } from './helpers/compare-screenshots';
import { getTestCases, TestCase } from './helpers/get-test-cases';
import { Screenshoter } from './helpers/screenshoter';
import { removeEmptyDirsRecursive, rmRf, withTimeout } from './utils';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const TEST_CASE_TIMEOUT = 5000;
const NUMBER_RETRIES = 3;

const goldenStandalonePathEnvKey = 'GOLDEN_STANDALONE_PATH';
const testStandalonePathEnvKey = 'TEST_STANDALONE_PATH';
const goldenTestContentPathEnvKey = 'GOLDEN_TEST_CONTENT_PATH';

function getDevicePixelRatio(): [number, string] {
	let devicePixelRatio = process.env.DEVICE_PIXEL_RATIO ? parseFloat(process.env.DEVICE_PIXEL_RATIO) : 1;
	if (isNaN(devicePixelRatio)) {
		devicePixelRatio = 1;
	}
	return [devicePixelRatio, devicePixelRatio.toFixed(2)];
}

const [devicePixelRatio, devicePixelRatioStr] = getDevicePixelRatio();

const testResultsOutDir = path.resolve(process.env.CMP_OUT_DIR || path.join(currentDirectory, '.gendata'));
const goldenStandalonePath: string = process.env[goldenStandalonePathEnvKey] || '';
const testStandalonePath: string = process.env[testStandalonePathEnvKey] || '';
const goldenContentDir: string = process.env[goldenTestContentPathEnvKey] || '';
const buildMode =
	process.env.PRODUCTION_BUILD === 'true' ? 'production' : 'development';

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
			registerTestCases(testCases[groupName], screenshoter, currentGroupOutDir, groupName);
		} else {
			void describe(groupName, () => {
				registerTestCases(testCases[groupName], screenshoter, currentGroupOutDir, groupName);
			});
		}
	}

	after(async () => {
		await screenshoter.close();
		removeEmptyDirsRecursive(testResultsOutDir);
	});
});

function registerTestCases(testCases: TestCase[], screenshoter: Screenshoter, outDir: string, groupName: string): void {
	const attempts: Record<string, number> = {};
	testCases.forEach((testCase: TestCase) => {
		attempts[testCase.name] = 0;
	});

	for (const testCase of testCases) {
		void it(testCase.name, { timeout: TEST_CASE_TIMEOUT * NUMBER_RETRIES + 1000 }, async () => {
			await retryTest(NUMBER_RETRIES, async () => {
				attempts[testCase.name] += 1;

				const testCaseOutDir = path.join(outDir, testCase.name);
				rmRf(testCaseOutDir);
				fs.mkdirSync(testCaseOutDir, { recursive: true });

				function writeTestDataItem(
					fileName: string,
					fileContent: string | Buffer
				): void {
					fs.writeFileSync(path.join(testCaseOutDir, fileName), fileContent);
				}

				function getGoldenContent(): string | null {
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

				const goldenPageContent = getGoldenContent();

				if (goldenPageContent === null) {
					if (goldenContentDir) {
						console.log(`SKIPPED: ${testCase.name}. Unable to loaded golden page content. It is likely this is a new test case.`);
					} else {
						expect(goldenPageContent, 'Unable to generate page content for golden test case').to.not.equal(null);
					}
					return;
				}

				const testPageContent = generatePageContent(
					testStandalonePath,
					testCase.caseContent,
					buildMode
				);

				writeTestDataItem('1.golden.html', goldenPageContent);
				writeTestDataItem('2.test.html', testPageContent);

				const errors: string[] = [];
				const failedPages: string[] = [];

				let goldenScreenshot: PNG | null = null;
				try {
					goldenScreenshot = await withTimeout(screenshoter.generateScreenshot(goldenPageContent), TEST_CASE_TIMEOUT);
					writeTestDataItem('1.golden.png', PNG.sync.write(goldenScreenshot));
				} catch (e: unknown) {
					errors.push(`=== Golden page ===\n${(e as Error).message}`);
					failedPages.push('golden');
					await screenshoter.close();
				}

				let testScreenshot: PNG | null = null;
				try {
					testScreenshot = await withTimeout(screenshoter.generateScreenshot(testPageContent), TEST_CASE_TIMEOUT);
					writeTestDataItem('2.test.png', PNG.sync.write(testScreenshot));
				} catch (e: unknown) {
					errors.push(`=== Test page ===\n${(e as Error).message}`);
					failedPages.push('test');
					await screenshoter.close();
				}

				if (goldenScreenshot !== null && testScreenshot !== null) {
					const compareResult = compareScreenshots(goldenScreenshot, testScreenshot);

					writeTestDataItem('3.diff.png', PNG.sync.write(compareResult.diffImg));

					expect(compareResult.diffPixelsCount).to.be.equal(0, 'number of different pixels must be 0');
				} else {
					writeTestDataItem('3.errors.txt', errors.join('\n\n'));
					expect(
						false,
						`The error(s) happened while generating a screenshot for the page(s): ${failedPages.join(', ')}. See ${testCaseOutDir} directory for an output of the test case.`
					).to.equal(true);
				}

				if (process.env.KEEP_OUT_DIR) {
					return;
				}

				rmRf(testCaseOutDir);
			});
		});
	}
}
