/// <reference types="node" />
import { expect } from 'chai';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import puppeteer, {
	Browser,
	HTTPResponse,
	launch as launchPuppeteer,
} from 'puppeteer';

import { Interaction, runInteractionsOnPage } from '../helpers/perform-interactions';
import { retryTest } from '../helpers/retry-tests';

import { generatePluginPageContent } from '../graphics/generate-plugin-test-cases';
import { getTestCases, InteractionTestCase } from './helpers/get-interaction-test-cases';

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
	testCaseReady: Promise<void>;
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

	const runTestCase = (testCase: InteractionTestCase, groupName: string) => {
		testCaseCount += 1;
		void it(testCase.name, { timeout: 15000 }, async () => {
			await retryTest(3, async () => {
				const esmPath = process.env.TEST_STANDALONE_ESM_PATH || '';
				const pageContent = testCase.plugin === undefined
					? generatePageContent(testStandalonePath, testCase.caseContent)
					: generatePluginPageContent(
						esmPath,
						testCase.plugin.packageName,
						`${esmPath.slice(0, esmPath.lastIndexOf('/') + 1)}${testCase.plugin.folder}.js`,
						testCase.caseContent,
						'development',
						'beforeInteractions'
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

				try {
					await page.setContent(pageContent, { waitUntil: 'load' });
					// Module-based plugin pages finish setup after their imports load.
					const setupKey = testCase.plugin === undefined ? 'finishedSetup' : 'testCaseReady';
					await page.waitForFunction((key: string) => Object.prototype.hasOwnProperty.call(window, key), {}, setupKey);
					await page.evaluate(
						(plugin: boolean) => {
							const state = window as unknown as InternalWindow;
							return plugin ? state.testCaseReady : state.finishedSetup;
						},
						testCase.plugin !== undefined
					);
					await runInteractionsOnPage(page);
					expect(errors, 'There should not be any errors thrown within the test page.').to.deep.equal([]);
				} catch (error) {
					// Preserve the visible state when an interaction assertion fails.
					const outDir = join(process.env.CMP_OUT_DIR || join(currentDirectory, '.gendata'), groupName || 'library');
					mkdirSync(outDir, { recursive: true });
					await page.screenshot({ path: join(outDir, `${testCase.name}.png`) });
					throw error;
				} finally {
					await page.close();
				}
			});
		});
	};

	const testCaseGroups = getTestCases();

	for (const groupName of Object.keys(testCaseGroups)) {
		if (groupName.length === 0) {
			for (const testCase of testCaseGroups[groupName]) {
				runTestCase(testCase, groupName);
			}
		} else {
			void describe(groupName, () => {
				for (const testCase of testCaseGroups[groupName]) {
					runTestCase(testCase, groupName);
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
