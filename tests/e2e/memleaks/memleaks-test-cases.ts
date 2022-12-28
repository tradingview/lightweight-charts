/// <reference types="node" />

import * as fs from 'fs';
import * as path from 'path';

import { expect } from 'chai';
import { describe, it } from 'mocha';
import puppeteer, { type Browser, type HTTPResponse, type JSHandle, type Page, type PuppeteerLaunchOptions } from 'puppeteer';

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

async function getReferencesCount(page: Page, prototypeReference: JSHandle): Promise<number> {
	const activeRefsHandle = await page.queryObjects(prototypeReference);
	const activeRefsCount = await (await activeRefsHandle?.getProperty('length'))?.jsonValue();

	await activeRefsHandle.dispose();

	return activeRefsCount;
}

function promisleep(ms: number): Promise<void> {
	return new Promise((resolve: () => void) => {
		setTimeout(resolve, ms);
	});
}

/**
 * Request garbage collection on the page.
 * **Note:** This is only a request and the page will still decide
 * when best to perform this action.
 */
async function requestGarbageCollection(page: Page): Promise<void> {
	const client = await page.target().createCDPSession();
	await client.send('HeapProfiler.enable');
	await client.send('HeapProfiler.collectGarbage');
	await client.send('HeapProfiler.disable');
	return page.evaluate(() => {
		// exposed when '--js-flags="expose-gc"' argument is used with chrome
		if (window.gc) {
			window.gc();
		}
	});
}

// Poll the references count on the page until the condition
// is satisfied for a specific prototype.
async function pollReferencesCount(
	page: Page,
	prototype: JSHandle,
	condition: (currentCount: number) => boolean,
	timeout: number,
	actionName?: string,
	tryCallGarbageCollection?: boolean
): Promise<number> {
	const start = performance.now();
	let referencesCount = 0;
	let done = false;
	do {
		const duration = performance.now() - start;
		if (duration > timeout) {
			throw new Error(`${actionName ? `${actionName}: ` : ''}Timeout exceeded waiting for references count to meet desired condition.`);
		}
		referencesCount = await getReferencesCount(page, prototype);
		done = condition(referencesCount);
		if (!done) {
			await promisleep(50);
			if (tryCallGarbageCollection) {
				await requestGarbageCollection(page);
			}
		}
	} while (!done);
	return referencesCount;
}

describe('Memleaks tests', function(): void {
	// this tests are unstable sometimes.
	this.retries(5);

	const puppeteerOptions: PuppeteerLaunchOptions = {};
	puppeteerOptions.args = ['--js-flags="expose-gc"'];
	if (process.env.NO_SANDBOX) {
		puppeteerOptions.args.push('--no-sandbox', '--disable-setuid-sandbox');
	}

	let browser: Browser;

	before(async function(): Promise<void> {
		this.timeout(40000); // puppeteer may take a while to launch for the first time.
		expect(testStandalonePath, `path to test standalone module must be passed via ${testStandalonePathEnvKey} env var`)
		.to.have.length.greaterThan(0);
		browser = await puppeteer.launch(puppeteerOptions);
		return Promise.resolve();
	});

	const testCases = getTestCases();

	it('number of test cases', () => {
		// we need to have at least 1 test to check it
		expect(testCases.length).to.be.greaterThan(0, 'there should be at least 1 test case');
	});

	for (const testCase of testCases) {
		// eslint-disable-next-line @typescript-eslint/no-loop-func
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

			page.on('response', (response: HTTPResponse) => {
				if (!response.ok()) {
					errors.push(`Network error: ${response.url()} status=${response.status()}`);
				}
			});

			const getCanvasPrototype = () => {
				return Promise.resolve(CanvasRenderingContext2D.prototype);
			};

			const prototype = await page.evaluateHandle(getCanvasPrototype);

			const referencesCountBefore = await getReferencesCount(page, prototype);

			await page.setContent(pageContent, { waitUntil: 'load' });

			if (errors.length !== 0) {
				throw new Error(`Page has errors:\n${errors.join('\n')}`);
			}

			// Wait until at least one canvas element has been created.
			await pollReferencesCount(
				page,
				prototype,
				(count: number) => count > referencesCountBefore,
				2500,
				'Creation'
			);

			// now remove chart

			await page.evaluate(() => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
				(window as any).chart.remove();

				// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
				delete (window as any).chart;
			});

			await requestGarbageCollection(page);

			// Wait until all the created canvas elements have been garbage collected.
			// Browser could keep references to DOM elements several milliseconds after its actual removing
			// So we have to wait to be sure all is clear
			const referencesCountAfter = await pollReferencesCount(
				page,
				prototype,
				(count: number) => count <= referencesCountBefore,
				10000,
				'Garbage Collection',
				true
			);

			expect(referencesCountAfter).to.be.equal(referencesCountBefore, 'There should not be extra references after removing a chart');
		});
	}
	after(async () => {
		await browser.close();
	});
});
