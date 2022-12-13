/// <reference types="node" />

import * as fs from 'fs';
import * as path from 'path';

import { expect } from 'chai';
import { describe, it } from 'mocha';
import puppeteer, {
	Browser,
	HTTPResponse,
	JSCoverageEntry,
	launch as launchPuppeteer,
	Page,
} from 'puppeteer';

import { TestCase } from '../helpers/get-test-cases';
import { Interaction, performInteractions } from '../helpers/perform-interactions';

import { expectedCoverage, threshold } from './coverage-config';
import { getTestCases } from './helpers/get-coverage-test-cases';

const dummyContent = fs.readFileSync(
	path.join(__dirname, 'helpers', 'test-page-dummy.html'),
	{ encoding: 'utf-8' }
);

function generatePageContent(
	standaloneBundlePath: string,
	testCaseCode: string
): string {
	return dummyContent
		.replace('PATH_TO_STANDALONE_MODULE', standaloneBundlePath)
		.replace('TEST_CASE_SCRIPT', testCaseCode);
}

const testStandalonePathEnvKey = 'TEST_STANDALONE_PATH';

const testStandalonePath: string = process.env[testStandalonePathEnvKey] || '';

interface InternalWindow {
	interactions: Interaction[];
	finishedSetup: Promise<() => void>;
	afterInteractions: () => void;
}

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

function generateAndSaveCoverageFile(coveredJs: string): void {
	// Create output directory
	const outDir = path.resolve(process.env.CMP_OUT_DIR || path.join(__dirname, '.gendata'));
	rmRf(outDir);
	fs.mkdirSync(outDir, { recursive: true });

	try {
		const filePath = path.join(outDir, 'covered.js');
		fs.writeFileSync(filePath, coveredJs);
		console.info('\nGenerated `covered.js` file for the coverage test.\n');
		console.info(filePath);
	} catch (error: unknown) {
		console.warn('Unable to save `covered.js` file for the coverage test.');
		console.error(error);
	}
}

async function getCoverageResult(page: Page): Promise<JSCoverageEntry | null> {
	const coverageEntries = await page.coverage.stopJSCoverage();
	const getFileNameFromUrl = (url: string): string => url.split('/').at(-1) ?? '';

	for (const entry of coverageEntries) {
		const fileName = getFileNameFromUrl(entry.url);
		if (fileName === 'test.js') { return entry; }
	}
	return null;
}

type CoverageTestResults = Record<string, JSCoverageEntry>;
interface Range {
	start: number;
	end: number;
}

interface CoverageResult {
	usedBytes: number;
	totalBytes: number;
	coverageFile: string;
}

function mergeRanges(ranges: Range[]): Range[] {
	ranges.sort((a: Range, b: Range) => {
		if (a.start === b.start) {
			return a.end - b.end;
		}
		return a.start - b.start;
	});
	const merged: Range[] = [];
	for (const range of ranges) {
		const last = merged.at(-1);
		if (!last || last.end < range.start) {
			merged.push(range);
		} else {
			last.end = Math.max(last.end, range.end);
		}
	}
	return merged;
}

function consolidateCoverageResults(testResults: CoverageTestResults): CoverageResult {
	const coveredRanges: Range[] = [];
	let testScriptCode = '';
	for (const [, coverageResult] of Object.entries(testResults)) {
		coveredRanges.push(...coverageResult.ranges);
		if (!testScriptCode) {
			// Every test is against the same library file,
			// therefore this will be the same for each coverageResult
			testScriptCode = coverageResult.text;
		}
	}
	const totalBytes = testScriptCode.length;
	const mergedRanges = mergeRanges(coveredRanges);
	let usedBytes = 0;
	let coverageFile = '';
	for (const range of mergedRanges) {
		usedBytes += (range.end - range.start);
		coverageFile += testScriptCode.slice(range.start, range.end) + '\n';
	}
	return {
		usedBytes,
		totalBytes,
		coverageFile,
	};
}

describe('Coverage tests', (): void => {
	const puppeteerOptions: Parameters<typeof launchPuppeteer>[0] = {};
	if (process.env.NO_SANDBOX) {
		puppeteerOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
	}

	let browser: Browser;

	before(async () => {
		expect(
			testStandalonePath,
			`path to test standalone module must be passed via ${testStandalonePathEnvKey} env var`
		).to.have.length.greaterThan(0);

		// note that we cannot use launchPuppeteer here as soon it wrong typing in puppeteer
		// see https://github.com/puppeteer/puppeteer/issues/7529
		const browserPromise = puppeteer.launch(puppeteerOptions);
		browser = await browserPromise;
	});

	let testCaseCount = 0;
	const coverageResults: CoverageTestResults = {};

	const runTestCase = (testCase: TestCase) => {
		testCaseCount += 1;
		it(testCase.name, async () => {
			const pageContent = generatePageContent(
				testStandalonePath,
				testCase.caseContent
			);

			const page = await browser.newPage();
			await page.coverage.startJSCoverage();
			await page.setViewport({ width: 600, height: 600 });

			const errors: string[] = [];
			page.on('pageerror', (error: Error) => {
				errors.push(error.message);
			});

			page.on('response', (response: HTTPResponse) => {
				if (!response.ok()) {
					errors.push(
						`Network error: ${response.url()} status=${response.status()}`
					);
				}
			});

			await page.setContent(pageContent, { waitUntil: 'load' });

			await page.evaluate(() => {
				return (window as unknown as InternalWindow).finishedSetup;
			});

			const interactionsToPerform = await page.evaluate(() => {
				return (window as unknown as InternalWindow).interactions;
			});

			await performInteractions(page, interactionsToPerform);

			await page.evaluate(() => {
				return new Promise<void>((resolve: () => void) => {
					(window as unknown as InternalWindow).afterInteractions();
					window.requestAnimationFrame(() => {
						setTimeout(resolve, 50);
					});
				});
			});

			if (errors.length !== 0) {
				throw new Error(`Page has errors:\n${errors.join('\n')}`);
			}

			expect(errors.length).to.be.equal(
				0,
				'There should not be any errors thrown within the test page.'
			);

			const result = await getCoverageResult(page);
			expect(result).not.to.be.equal(null);
			if (result) {
				coverageResults[testCase.name] = result;
			}
		});
	};

	const testCaseGroups = getTestCases();

	for (const groupName of Object.keys(testCaseGroups)) {
		if (groupName.length === 0) {
			for (const testCase of testCaseGroups[groupName]) {
				runTestCase(testCase);
			}
		} else {
			describe(groupName, () => {
				for (const testCase of testCaseGroups[groupName]) {
					runTestCase(testCase);
				}
			});
		}
	}

	it('number of test cases', () => {
		// we need to have at least 1 test to check it
		expect(testCaseCount).to.be.greaterThan(
			0,
			'there should be at least 1 test case'
		);
	});

	after(async () => {
		await browser.close();

		const consolidatedResult = consolidateCoverageResults(coverageResults);
		expect(consolidatedResult.usedBytes).to.be.lessThanOrEqual(consolidatedResult.totalBytes, 'Used bytes should be less than or equal to Total bytes.');
		expect(consolidatedResult.usedBytes).to.be.greaterThan(0, 'Used bytes should be more than zero.');

		if (process.env.GENERATE_COVERAGE_FILE === 'true') {
			generateAndSaveCoverageFile(consolidatedResult.coverageFile);
		}

		const currentCoverage = parseFloat(((consolidatedResult.usedBytes / consolidatedResult.totalBytes) * 100).toFixed(2));
		expect(currentCoverage).to.be.closeTo(expectedCoverage, threshold, `Please either update config to pass the test or improve coverage`);
		console.log(`Current coverage is ${currentCoverage.toFixed(2)}% (${formatChange(currentCoverage - expectedCoverage)}%)`);
	});
});

function formatChange(change: number): string {
	return change < 0 ? change.toFixed(1) : `+${change.toFixed(1)}`;
}
