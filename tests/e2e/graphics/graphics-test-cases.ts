/// <reference types="node" />

import * as fs from 'fs';
import * as path from 'path';

import { expect } from 'chai';
import {
	after,
	describe,
	it,
} from 'mocha';
import { PNG } from 'pngjs';

import { compareScreenshots } from './helpers/compare-screenshots';
import { getTestCases, TestCase } from './helpers/get-test-cases';
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

let devicePixelRatio = process.env.DEVICE_PIXEL_RATIO ? parseFloat(process.env.DEVICE_PIXEL_RATIO) : 1;
if (isNaN(devicePixelRatio)) {
	devicePixelRatio = 1;
}

const devicePixelRatioStr = devicePixelRatio.toFixed(2);

const testResultsOutDir = path.resolve(process.env.CMP_OUT_DIR || path.join(__dirname, '.gendata'));
const goldenStandalonePath: string = process.env[goldenStandalonePathEnvKey] || '';
const testStandalonePath: string = process.env[testStandalonePathEnvKey] || '';

function rmRf(dir: string): void {
	if (!fs.existsSync(dir)) {
		return;
	}

	fs.readdirSync(dir).forEach((file: string) => {
		const filePath = path.join(dir, file);
		if (fs.lstatSync(filePath).isDirectory()) {
			rmRf(filePath);
		} else {
			fs.unlinkSync(filePath);
		}
	});

	fs.rmdirSync(dir);
}

function removeEmptyDirsRecursive(rootDir: string): void {
	if (!fs.existsSync(rootDir)) {
		return;
	}

	fs.readdirSync(rootDir).forEach((file: string) => {
		const filePath = path.join(rootDir, file);
		if (fs.lstatSync(filePath).isDirectory()) {
			removeEmptyDirsRecursive(filePath);
		}
	});

	if (fs.readdirSync(rootDir).length === 0) {
		fs.rmdirSync(rootDir);
	}
}

describe(`Graphics tests with devicePixelRatio=${devicePixelRatioStr}`, function(): void {
	// this tests are unstable sometimes :(
	this.retries(5);

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
			registerTestCases(testCases[groupName], screenshoter, currentGroupOutDir);
		} else {
			describe(groupName, () => {
				registerTestCases(testCases[groupName], screenshoter, currentGroupOutDir);
			});
		}
	}

	after(async () => {
		await screenshoter.close();
		removeEmptyDirsRecursive(testResultsOutDir);
	});
});

function registerTestCases(testCases: TestCase[], screenshoter: Screenshoter, outDir: string): void {
	for (const testCase of testCases) {
		it(testCase.name, async () => {
			const testCaseOutDir = path.join(outDir, testCase.name);
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
See ${testCaseOutDir} directory for an output of the test case.`
				);
			}

			rmRf(testCaseOutDir);
		});
	}
}
