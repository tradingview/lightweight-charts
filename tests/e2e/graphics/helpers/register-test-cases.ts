/// <reference types="node" />
import { expect } from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { it } from 'node:test';
import { PNG } from 'pngjs';

import { retryTest } from '../../helpers/retry-tests';

import { rmRf, withTimeout } from '../utils';
import { compareScreenshots } from './compare-screenshots';
import { TestCase } from './get-test-cases';
import { Screenshoter } from './screenshoter';

const TEST_CASE_TIMEOUT = 5000;
const NUMBER_RETRIES = 3;

export interface TestCasePages {
	/** Page content for the golden build, or null when there is none and the case is skipped. */
	golden: (testCase: TestCase) => string | null;
	test: (testCase: TestCase) => string;
	/** Printed when `golden` returns null; when omitted a missing golden page fails the case. */
	skipMessage?: string;
}

/**
 * Registers one `it` per test case: renders the golden and test pages,
 * screenshots both and requires them to be pixel-identical. Shared by the
 * library suite and the plugin suite, which differ only in how they discover
 * cases and build pages.
 */
export function registerTestCases(
	testCases: TestCase[],
	screenshoter: Screenshoter,
	outDir: string,
	pages: TestCasePages
): void {
	for (const testCase of testCases) {
		void it(testCase.name, { timeout: TEST_CASE_TIMEOUT * NUMBER_RETRIES + 1000 }, async () => {
			await retryTest(NUMBER_RETRIES, async () => {
				const testCaseOutDir = path.join(outDir, testCase.name);
				rmRf(testCaseOutDir);
				fs.mkdirSync(testCaseOutDir, { recursive: true });

				function writeTestDataItem(
					fileName: string,
					fileContent: string | Buffer
				): void {
					fs.writeFileSync(path.join(testCaseOutDir, fileName), fileContent);
				}

				const goldenPageContent = pages.golden(testCase);

				if (goldenPageContent === null) {
					if (pages.skipMessage !== undefined) {
						console.log(`SKIPPED: ${testCase.name}. ${pages.skipMessage}`);
					} else {
						expect(goldenPageContent, 'Unable to generate page content for golden test case').to.not.equal(null);
					}
					return;
				}

				const testPageContent = pages.test(testCase);

				writeTestDataItem('1.golden.html', goldenPageContent);
				writeTestDataItem('2.test.html', testPageContent);

				const errors: string[] = [];
				const failedPages: string[] = [];

				let goldenScreenshot: PNG | null = null;
				try {
					goldenScreenshot = await withTimeout(screenshoter.generateScreenshot(goldenPageContent), TEST_CASE_TIMEOUT);
					writeTestDataItem('1.golden.png', PNG.sync.write(goldenScreenshot));
				} catch (e: unknown) {
					errors.push(`=== Golden page ===\n${(e as Error).message}`);
					failedPages.push('golden');
					await screenshoter.close();
				}

				let testScreenshot: PNG | null = null;
				try {
					testScreenshot = await withTimeout(screenshoter.generateScreenshot(testPageContent), TEST_CASE_TIMEOUT);
					writeTestDataItem('2.test.png', PNG.sync.write(testScreenshot));
				} catch (e: unknown) {
					errors.push(`=== Test page ===\n${(e as Error).message}`);
					failedPages.push('test');
					await screenshoter.close();
				}

				if (goldenScreenshot !== null && testScreenshot !== null) {
					const compareResult = compareScreenshots(goldenScreenshot, testScreenshot);

					writeTestDataItem('3.diff.png', PNG.sync.write(compareResult.diffImg));

					expect(compareResult.diffPixelsCount).to.be.equal(0, 'number of different pixels must be 0');
				} else {
					writeTestDataItem('3.errors.txt', errors.join('\n\n'));
					expect(
						false,
						`The error(s) happened while generating a screenshot for the page(s): ${failedPages.join(', ')}. See ${testCaseOutDir} directory for an output of the test case.`
					).to.equal(true);
				}

				if (process.env.KEEP_OUT_DIR) {
					return;
				}

				rmRf(testCaseOutDir);
			});
		});
	}
}

export function getDevicePixelRatio(): [number, string] {
	let devicePixelRatio = process.env.DEVICE_PIXEL_RATIO ? parseFloat(process.env.DEVICE_PIXEL_RATIO) : 1;
	if (isNaN(devicePixelRatio)) {
		devicePixelRatio = 1;
	}
	return [devicePixelRatio, devicePixelRatio.toFixed(2)];
}

export function getBuildMode(): 'production' | 'development' {
	return process.env.PRODUCTION_BUILD === 'true' ? 'production' : 'development';
}
