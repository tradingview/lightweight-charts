/// <reference types="node" />

import { PNG } from 'pngjs';
import puppeteer, {
	Browser,
	ConsoleMessage,
	HTTPResponse,
	LaunchOptions,
	Page,
} from 'puppeteer';

import { runInteractionsOnPage } from '../../helpers/perform-interactions';

import { MouseEventParams } from '../../../../src/api/ichart-api';
import { TestCaseWindow } from './testcase-window-type';

const viewportWidth = 600;
const viewportHeight = 600;

export class Screenshoter {
	private _browserPromise: Promise<Browser>;
	private _noSandbox: boolean;
	private _devicePixelRatio: number;
	private _created: boolean = false;

	public constructor(noSandbox: boolean, devicePixelRatio: number = 1) {
		this._noSandbox = noSandbox;
		this._devicePixelRatio = devicePixelRatio;
		this._browserPromise = this._createBrowser();
	}

	public async close(): Promise<void> {
		const browser = await this._browserPromise;
		await browser.close();
		this._created = false;
	}

	public async generateScreenshot(pageContent: string): Promise<PNG> {
		let page: Page | undefined;

		try {
			if (!this._created) {
				this._browserPromise = this._createBrowser();
			}
			const browser = await this._browserPromise;
			page = await browser.newPage();

			const errors: string[] = [];
			page.on('pageerror', (error: Error) => {
				errors.push(error.message);
			});

			page.on('console', (message: ConsoleMessage) => {
				const type = message.type();
				if (type === 'error' || type === 'assert') {
					errors.push(`Console ${type}: ${message.text()}`);
				}
			});

			page.on('response', (response: HTTPResponse) => {
				if (!response.ok()) {
					errors.push(`Network error: ${response.url()} status=${response.status()}`);
				}
			});

			await page.setContent(pageContent, { waitUntil: 'load' });

			// wait for test case is ready
			await page.evaluate(() => {
				return (window as unknown as TestCaseWindow).testCaseReady;
			});

			const shouldIgnoreMouseMove = await page.evaluate(() => {
				return Boolean((window as unknown as TestCaseWindow).ignoreMouseMove);
			});

			const hasChartGlobal = await page.evaluate(() => {
				return Boolean((window as unknown as TestCaseWindow).chart);
			});

			if (!shouldIgnoreMouseMove && !hasChartGlobal) {
				throw new Error('Either an error occurred during the chart creation, or the window variable `chart` was required because `ignoreMouseMove` was not set to true');
			}

			if (!shouldIgnoreMouseMove) {
				// move mouse to top-left corner
				await page.mouse.move(0, 0);
			}

			if (!shouldIgnoreMouseMove) {
				const waitForMouseMove = page.evaluate(() => {
					if ((window as unknown as TestCaseWindow).ignoreMouseMove) { return Promise.resolve(); }
					return new Promise<number[]>((resolve: (value: number[]) => void) => {
						const chart = (window as unknown as TestCaseWindow).chart;
						if (!chart) {
							// An error occurred during the chart creation
							return;
						}
						chart.subscribeCrosshairMove((param: MouseEventParams) => {
							const point = param.point;
							if (!point) { return; }
							if (point.x > 0 && point.y > 0) {
								requestAnimationFrame(() => resolve([point.x, point.y] as number[]));
							}
						});
					});
				});
				// to avoid random cursor position
				await page.mouse.move(viewportWidth / 2, viewportHeight / 2);
				await waitForMouseMove;
			}

			await runInteractionsOnPage(page);

			// let's wait until the next af to make sure that everything is repainted
			await page.evaluate(() => {
				return new Promise<void>((resolve: () => void) => {
					window.requestAnimationFrame(() => {
						// and a little more time after af :)
						// Note: This timeout value isn't part of the test and is only
						//       included to improve the reliability of the test.
						setTimeout(resolve, 250);
					});
				});
			});

			if (errors.length !== 0) {
				throw new Error(errors.join('\n'));
			}

			const uint8Array = await page.screenshot({ encoding: 'binary' });
			const pageScreenshotPNG = PNG.sync.read(Buffer.from(uint8Array));
			const additionalScreenshotDataURL = await page.evaluate(() => {
				const testCaseWindow = window as unknown as TestCaseWindow;
				if (!testCaseWindow.checkChartScreenshot) {
					return Promise.resolve(null);
				}

				const chart = testCaseWindow.chart;
				if (chart === undefined) {
					return Promise.resolve(null);
				}

				return chart.takeScreenshot().toDataURL();
			});

			if (additionalScreenshotDataURL !== null) {
				const additionalScreenshotBuffer = Buffer.from(additionalScreenshotDataURL.split(',')[1], 'base64');
				const additionalScreenshotPNG = new PNG();
				await new Promise((resolve: (data: PNG) => void, reject: (reason: Error) => void) => {
					additionalScreenshotPNG.parse(additionalScreenshotBuffer, (error: Error, data: PNG) => {
						if (error === null) {
							resolve(data);
						} else {
							reject(error);
						}
					});
				});

				const additionalScreenshotPadding = 20;
				additionalScreenshotPNG.bitblt(
					pageScreenshotPNG,
					0,
					0,
					// additionalScreenshotPNG could be cropped
					Math.min(pageScreenshotPNG.width, additionalScreenshotPNG.width),
					additionalScreenshotPNG.height,
					0,
					// additional screenshot height should be equal to HTML element height on page screenshot
					additionalScreenshotPadding + additionalScreenshotPNG.height
				);
			}
			return pageScreenshotPNG;
		} finally {
			if (page !== undefined) {
				await page.close();
			}
		}
	}

	private _createBrowser(): Promise<Browser> {
		const puppeteerOptions: LaunchOptions = {
			defaultViewport: {
				deviceScaleFactor: this._devicePixelRatio,
				width: viewportWidth,
				height: viewportHeight,
			},
			headless: true,
		};

		if (this._noSandbox) {
			puppeteerOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
		}
		this._created = true;
		return puppeteer.launch(puppeteerOptions);
	}
}
