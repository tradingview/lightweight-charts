/// <reference types="node" />

import * as fs from 'fs';
import * as path from 'path';

import { expect } from 'chai';
import { describe, it } from 'mocha';
import { PNG } from 'pngjs';

import { CompareResult, compareScreenshots } from './helpers/compare-screenshots';
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

const testResultsOutDir = process.env.CMP_OUT_DIR || path.join(__dirname, '.gendata');
const goldenStandalonePath = process.env[goldenStandalonePathEnvKey] || '';
const testStandalonePath = process.env[testStandalonePathEnvKey] || '';

function testCaseFolder(testCaseName: string): string {
	return path.join(testResultsOutDir, testCaseName);
}

function writeTestData(
	testCaseName: string,
	goldenScreenshot: PNG,
	testScreenshot: PNG,
	compareResult: CompareResult,
	goldenPageContent: string,
	testPageContent: string
): void {
	const testCaseOutDir = testCaseFolder(testCaseName);
	if (!fs.existsSync(testCaseOutDir)) {
		fs.mkdirSync(testCaseOutDir);
	}

	fs.writeFileSync(path.join(testCaseOutDir, '1.golden.png'), PNG.sync.write(goldenScreenshot));
	fs.writeFileSync(path.join(testCaseOutDir, '2.test.png'), PNG.sync.write(testScreenshot));
	fs.writeFileSync(path.join(testCaseOutDir, '3.diff.png'), PNG.sync.write(compareResult.diffImg));

	fs.writeFileSync(path.join(testCaseOutDir, '1.golden.html'), goldenPageContent);
	fs.writeFileSync(path.join(testCaseOutDir, '2.test.html'), testPageContent);
}

function removeTestCaseFolder(testCaseName: string): void {
	const testCaseOutDir = testCaseFolder(testCaseName);
	fs.readdirSync(testCaseOutDir).forEach((file: string) => {
		const filePath = path.join(testCaseOutDir, file);
		if (fs.lstatSync(filePath).isDirectory()) {
			removeTestCaseFolder(filePath);
		} else {
			fs.unlinkSync(filePath);
		}
	});

	fs.rmdirSync(testCaseOutDir);
}

describe('Graphics tests', function(): void {
	// this tests are unstable sometimes :(
	this.retries(5);

	const testCases = getTestCases();
	let screenshoter: Screenshoter;

	before(() => {
		if (!fs.existsSync(testResultsOutDir)) {
			fs.mkdirSync(testResultsOutDir, { recursive: true });
		}

		expect(goldenStandalonePath, `path to golden standalone module must be passed via ${goldenStandalonePathEnvKey} env var`)
			.to.have.length.greaterThan(0);

		expect(testStandalonePath, `path to golden standalone module must be passed via ${testStandalonePathEnvKey} env var`)
			.to.have.length.greaterThan(0);

		screenshoter = new Screenshoter(Boolean(process.env.NO_SANDBOX));
	});

	it('number of test cases', () => {
		// we need to have at least 1 test to check it
		expect(testCases.length).to.be.greaterThan(0, 'there should be at least 1 test case');
	});

	for (const testCase of testCases) {
		it(testCase.name, async () => {
			const goldenPageContent = generatePageContent(goldenStandalonePath, testCase.caseContent);
			const testPageContent = generatePageContent(testStandalonePath, testCase.caseContent);

			// run in parallel to increase speed
			const [goldenScreenshot, testScreenshot] = await Promise.all([
				screenshoter.generateScreenshot(goldenPageContent),
				screenshoter.generateScreenshot(testPageContent),
			]);

			const compareResult = await compareScreenshots(goldenScreenshot, testScreenshot);

			writeTestData(
				testCase.name,
				goldenScreenshot,
				testScreenshot,
				compareResult,
				goldenPageContent,
				testPageContent
			);

			expect(compareResult.diffPixelsCount).to.be.equal(0, 'number of different pixels must be 0');

			removeTestCaseFolder(testCase.name);
		});
	}

	after(async () => {
		await screenshoter.close();
	});
});
