/// <reference types="node" />

import * as fs from 'fs';
import * as path from 'path';

import { expect } from 'chai';
import { describe, it } from 'mocha';
import puppeteer, {
	Browser,
	HTTPResponse,
	launch as launchPuppeteer,
} from 'puppeteer';

import { TestCase } from '../helpers/get-test-cases';
import {
	Interaction,
	performInteractions,
} from '../helpers/perform-interactions';

import { getTestCases } from './helpers/get-interaction-test-cases';

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
	initialInteractions: Interaction[];
	finalInteractions: Interaction[];
	finishedSetup: Promise<() => void>;
	afterInitialInteractions?: () => void;
	afterFinalInteractions: () => void;
}

describe('Interactions tests', function(): void {
	// this tests are unstable sometimes.
	this.retries(5);

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
		it(testCase.name, async () => {
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

			const initialInteractionsToPerform = await page.evaluate(() => {
				return (window as unknown as InternalWindow).initialInteractions;
			});

			await performInteractions(page, initialInteractionsToPerform);

			await page.evaluate(() => {
				if ((window as unknown as InternalWindow).afterInitialInteractions) {
					return (
						window as unknown as InternalWindow
					).afterInitialInteractions?.();
				}
				return new Promise<void>((resolve: () => void) => {
					window.requestAnimationFrame(() => {
						setTimeout(resolve, 50);
					});
				});
			});

			const finalInteractionsToPerform = await page.evaluate(() => {
				return (window as unknown as InternalWindow).finalInteractions;
			});

			if (finalInteractionsToPerform && finalInteractionsToPerform.length > 0) {
				await performInteractions(page, finalInteractionsToPerform);
			}

			await page.evaluate(() => {
				return new Promise<void>((resolve: () => void) => {
					(window as unknown as InternalWindow).afterFinalInteractions();
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
	});
});
