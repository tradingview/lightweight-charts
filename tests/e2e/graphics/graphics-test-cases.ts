/// <reference types="node" />

import * as fs from 'fs';
import * as path from 'path';

import { expect } from 'chai';
import {
	after,
	afterEach,
	Context,
	describe,
	it,
} from 'mocha';
import { PNG } from 'pngjs';

import { compareScreenshots } from './helpers/compare-screenshots';
import { getTestCases } from './helpers/get-test-cases';
import { Screenshoter } from './helpers/screenshoter';

const dummyContent = fs.readFileSync(path.join(__dirname, 'helpers', 'test-page-dummy.html'), { encoding: 'utf-8' });

function generatePageContent(standaloneBundlePath: string, testCaseCode: string): string {
	return dummyContent
		.replace('PATH_TO_STANDALONE_MODULE', standaloneBundlePath)
		.replace('TEST_CASE_SCRIPT', testCaseCode)
	;
}

const goldenStandalonePathEnvKey = 'GOLDEN_STANDALONE_PATH';
const testStandalonePathEnvKey = 'TEST_STANDALONE_PATH';

const testResultsOutDir = path.resolve(process.env.CMP_OUT_DIR || path.join(__dirname, '.gendata'));
const goldenStandalonePath = process.env[goldenStandalonePathEnvKey] || '';
const testStandalonePath = process.env[testStandalonePathEnvKey] || '';

function testGroupOutFolder(groupName: string): string {
	return path.join(testResultsOutDir, groupName);
}

function testCaseOutFolder(groupName: string, testCaseName: string): string {
	return path.join(testGroupOutFolder(groupName), testCaseName);
}

function rmRf(folder: string): void {
	if (!fs.existsSync(folder)) {
		return;
	}

	fs.readdirSync(folder).forEach((file: string) => {
		const filePath = path.join(folder, file);
		if (fs.lstatSync(filePath).isDirectory()) {
			rmRf(filePath);
		} else {
			fs.unlinkSync(filePath);
		}
	});

	fs.rmdirSync(folder);
}

describe('Graphics tests', function(): void {
	// this tests are unstable sometimes :(
	this.retries(5);

	const testCases = getTestCases();
	let screenshoter: Screenshoter;

	before(() => {
		rmRf(testResultsOutDir);
		fs.mkdirSync(testResultsOutDir, { recursive: true });

		expect(goldenStandalonePath, `path to golden standalone module must be passed via ${goldenStandalonePathEnvKey} env var`)
			.to.have.length.greaterThan(0);

		expect(testStandalonePath, `path to golden standalone module must be passed via ${testStandalonePathEnvKey} env var`)
			.to.have.length.greaterThan(0);

		screenshoter = new Screenshoter(Boolean(process.env.NO_SANDBOX));
	});

	const registerTestGroup = (groupName: string) => {
		for (const testCase of testCases[groupName]) {
			it(testCase.name, async () => {
				const testCaseOutDir = testCaseOutFolder(groupName, testCase.name);
				rmRf(testCaseOutDir);
				fs.mkdirSync(testCaseOutDir, { recursive: true });

				function writeTestDataItem(fileName: string, fileContent: string | Buffer): void {
					fs.writeFileSync(path.join(testCaseOutDir, fileName), fileContent);
				}

				const goldenPageContent = generatePageContent(goldenStandalonePath, testCase.caseContent);
				const testPageContent = generatePageContent(testStandalonePath, testCase.caseContent);

				writeTestDataItem('1.golden.html', goldenPageContent);
				writeTestDataItem('2.test.html', testPageContent);

				// run in parallel to increase speed
				const goldenScreenshotPromise = screenshoter.generateScreenshot(goldenPageContent);
				const testScreenshotPromise = screenshoter.generateScreenshot(testPageContent);

				const errors: string[] = [];
				const failedPages: string[] = [];

				let goldenScreenshot: PNG | null = null;
				try {
					goldenScreenshot = await goldenScreenshotPromise;
					writeTestDataItem('1.golden.png', PNG.sync.write(goldenScreenshot));
				} catch (e) {
					errors.push(`=== Golden page ===\n${e.message}`);
					failedPages.push('golden');
				}

				let testScreenshot: PNG | null = null;
				try {
					testScreenshot = await testScreenshotPromise;
					writeTestDataItem('2.test.png', PNG.sync.write(testScreenshot));
				} catch (e) {
					errors.push(`=== Test page ===\n${e.message}`);
					failedPages.push('test');
				}

				if (goldenScreenshot !== null && testScreenshot !== null) {
					const compareResult = await compareScreenshots(goldenScreenshot, testScreenshot);

					writeTestDataItem('3.diff.png', PNG.sync.write(compareResult.diffImg));

					expect(compareResult.diffPixelsCount).to.be.equal(0, 'number of different pixels must be 0');
				} else {
					writeTestDataItem('3.errors.txt', errors.join('\n\n'));
					throw new Error(
						`The error(s) happened while generating a screenshot for the page(s): ${failedPages.join(', ')}.
See ${testCaseOutDir} folder for an output of the test case.`
					);
				}

				rmRf(testCaseOutDir);
			});
		}
	};

	for (const groupName of Object.keys(testCases)) {
		if (groupName.length === 0) {
			registerTestGroup(groupName);
		} else {
			describe(groupName, () => {
				registerTestGroup(groupName);

				let isGroupFailed = false;

				afterEach(function(this: Context): void {
					if (this.currentTest !== undefined && this.currentTest.state === 'failed') {
						isGroupFailed = true;
					}
				});

				after(() => {
					if (!isGroupFailed) {
						rmRf(testGroupOutFolder(groupName));
					}
				});
			});
		}
	}

	after(async () => {
		await screenshoter.close();
	});
});
