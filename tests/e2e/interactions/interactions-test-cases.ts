/// <reference types="node" />
import { expect } from 'chai';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import puppeteer, {
	Browser,
	HTTPResponse,
	launch as launchPuppeteer,
} from 'puppeteer';

import { TestCase } from '../helpers/get-test-cases';
import { Interaction, runInteractionsOnPage } from '../helpers/perform-interactions';
import { retryTest } from '../helpers/retry-tests';

import { getTestCases } from './helpers/get-interaction-test-cases';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFilePath);

const dummyContent = readFileSync(
	join(currentDirectory, 'helpers', 'test-page-dummy.html'),
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
	initialInteractionsToPerform: () => Interaction[];
	finalInteractionsToPerform: () => Interaction[];
	finishedSetup: Promise<() => void>;
	afterInitialInteractions?: () => void;
	afterFinalInteractions: () => void;
}

void describe('Interactions tests', () => {
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

	const runTestCase = (testCase: TestCase) => {
		testCaseCount += 1;
		void it(testCase.name, { timeout: 15000 }, async () => {
			await retryTest(3, async () => {
				const pageContent = generatePageContent(
					testStandalonePath,
					testCase.caseContent
				);

				const page = await browser.newPage();
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

				await runInteractionsOnPage(page);

				await page.close();

				if (errors.length !== 0) {
					throw new Error(`Page has errors:\n${errors.join('\n')}`);
				}

				expect(errors.length).to.be.equal(
					0,
					'There should not be any errors thrown within the test page.'
				);
			});
		});
	};

	const testCaseGroups = getTestCases();

	for (const groupName of Object.keys(testCaseGroups)) {
		if (groupName.length === 0) {
			for (const testCase of testCaseGroups[groupName]) {
				runTestCase(testCase);
			}
		} else {
			void describe(groupName, () => {
				for (const testCase of testCaseGroups[groupName]) {
					runTestCase(testCase);
				}
			});
		}
	}

	void it('number of test cases', () => {
		// we need to have at least 1 test to check it
		expect(testCaseCount).to.be.greaterThan(
			0,
			'there should be at least 1 test case'
		);
	});

	after(async () => {
		await browser.close();
	});
});
