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

function testCaseOutFolder(groupName: string, testCaseName: string): string {
	return path.join(testResultsOutDir, groupName, testCaseName);
}

function writeTestData(// tslint:disable-next-line:max-params
	groupName: string,
	testCaseName: string,
	goldenScreenshot: PNG,
	testScreenshot: PNG,
	compareResult: CompareResult,
	goldenPageContent: string,
	testPageContent: string
): void {
	const testCaseOutDir = testCaseOutFolder(groupName, testCaseName);
	if (!fs.existsSync(testCaseOutDir)) {
		fs.mkdirSync(testCaseOutDir, { recursive: true });
	}

	fs.writeFileSync(path.join(testCaseOutDir, '1.golden.png'), PNG.sync.write(goldenScreenshot));
	fs.writeFileSync(path.join(testCaseOutDir, '2.test.png'), PNG.sync.write(testScreenshot));
	fs.writeFileSync(path.join(testCaseOutDir, '3.diff.png'), PNG.sync.write(compareResult.diffImg));

	fs.writeFileSync(path.join(testCaseOutDir, '1.golden.html'), goldenPageContent);
	fs.writeFileSync(path.join(testCaseOutDir, '2.test.html'), testPageContent);
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

function removeTestCaseFolder(groupName: string, testCaseName: string): void {
	rmRf(testCaseOutFolder(groupName, testCaseName));
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

	for (const groupName of Object.keys(testCases)) {
		const registerTestGroup = () => {
			for (const testCase of testCases[groupName]) {
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
						groupName,
						testCase.name,
						goldenScreenshot,
						testScreenshot,
						compareResult,
						goldenPageContent,
						testPageContent
					);

					expect(compareResult.diffPixelsCount).to.be.equal(0, 'number of different pixels must be 0');

					removeTestCaseFolder(groupName, testCase.name);
				});
			}
		};

		if (groupName.length === 0) {
			registerTestGroup();
		} else {
			describe(groupName, registerTestGroup);
		}
	}

	after(async () => {
		await screenshoter.close();
	});
});
