/// <reference types="node" />

import * as fs from 'fs';
import * as path from 'path';

import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Browser, Frame, JSHandle, launch as launchPuppeteer, LaunchOptions, Response } from 'puppeteer';

import { getTestCases } from './helpers/get-test-cases';

const dummyContent = fs.readFileSync(path.join(__dirname, 'helpers', 'test-page-dummy.html'), { encoding: 'utf-8' });

function generatePageContent(standaloneBundlePath: string, testCaseCode: string): string {
	return dummyContent
		.replace('PATH_TO_STANDALONE_MODULE', standaloneBundlePath)
		.replace('TEST_CASE_SCRIPT', testCaseCode)
	;
}

const testStandalonePathEnvKey = 'TEST_STANDALONE_PATH';

const testStandalonePath: string = process.env[testStandalonePathEnvKey] || '';

async function getReferencesCount(frame: Frame, prototypeReference: JSHandle): Promise<number> {
	const context = await frame.executionContext();
	const activeRefsHandle = await context.queryObjects(prototypeReference);
	const activeRefsCount = await (await activeRefsHandle.getProperty('length')).jsonValue() as number;

	activeRefsHandle.dispose();

	return activeRefsCount;
}

// tslint:disable-next-line:invalid-void
function promisleep(ms: number): Promise<void> {
	return new Promise((resolve: () => void) => {
		setTimeout(resolve, ms);
	});
}

describe('Memleaks tests', () => {
	const puppeteerOptions: LaunchOptions = {};
	if (Boolean(process.env.NO_SANDBOX)) {
		puppeteerOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
	}

	let browser: Browser;

	before(async () => {
		expect(testStandalonePath, `path to test standalone module must be passed via ${testStandalonePathEnvKey} env var`)
			.to.have.length.greaterThan(0);

		const browserPromise = launchPuppeteer(puppeteerOptions);
		browser = await browserPromise;
	});

	const testCases = getTestCases();

	it('number of test cases', () => {
		// we need to have at least 1 test to check it
		expect(testCases.length).to.be.greaterThan(0, 'there should be at least 1 test case');
	});

	for (const testCase of testCases) {
		it(testCase.name, async () => {
			const pageContent = generatePageContent(testStandalonePath, testCase.caseContent);

			const page = await browser.newPage();
			await page.setViewport({ width: 600, height: 600 });

			// set empty page as a content to get initial number
			// of references
			await page.setContent('<html><body></body></html>', { waitUntil: 'load' });

			const errors: string[] = [];
			page.on('pageerror', (error: Error) => {
				errors.push(error.message);
			});

			page.on('response', (response: Response) => {
				if (!response.ok()) {
					errors.push(`Network error: ${response.url()} status=${response.status()}`);
				}
			});

			const getCanvasPrototype = () => {
				return Promise.resolve(CanvasRenderingContext2D.prototype);
			};

			const frame = page.mainFrame();
			const context = await frame.executionContext();

			const prototype = await context.evaluateHandle(getCanvasPrototype);

			const referencesCountBefore = await getReferencesCount(frame, prototype);

			await page.setContent(pageContent, { waitUntil: 'load' });

			if (errors.length !== 0) {
				throw new Error(`Page has errors:\n${errors.join('\n')}`);
			}

			// now remove chart

			await page.evaluate(() => {
				// tslint:disable-next-line:no-any
				(window as any).chart.remove();
			});

			// IMPORTANT: This timeout is important
			// Browser could keep references to DOM elements several milliseconds after its actual removing
			// So we have to wait to be sure all is clear
			await promisleep(100);

			const referencesCountAfter = await getReferencesCount(frame, prototype);

			expect(referencesCountAfter).to.be.equal(referencesCountBefore, 'There should not be extra references after removing a chart');
		});
	}
	after(async () => {
		await browser.close();
	});
});
