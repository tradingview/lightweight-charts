/// <reference types="node" />

import { PNG } from 'pngjs';
import puppeteer, {
	Browser,
	ConsoleMessage,
	HTTPResponse,
	launch as launchPuppeteer,
	Page,
} from 'puppeteer';

import { MouseEventParams } from '../../../../src/api/ichart-api';
import { TestCaseWindow } from './testcase-window-type';

const viewportWidth = 600;
const viewportHeight = 600;

export class Screenshoter {
	private _browserPromise: Promise<Browser>;

	public constructor(noSandbox: boolean, devicePixelRatio: number = 1) {
		const puppeteerOptions: Parameters<typeof launchPuppeteer>[0] = {
			defaultViewport: {
				deviceScaleFactor: devicePixelRatio,
				width: viewportWidth,
				height: viewportHeight,
			},
		};

		if (noSandbox) {
			puppeteerOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
		}

		// note that we cannot use launchPuppeteer here as soon it wrong typing in puppeteer
		// see https://github.com/puppeteer/puppeteer/issues/7529
		this._browserPromise = puppeteer.launch(puppeteerOptions);
	}

	public async close(): Promise<void> {
		const browser = await this._browserPromise;
		await browser.close();
	}

	public async generateScreenshot(pageContent: string): Promise<PNG> {
		let page: Page | undefined;

		try {
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

			// move mouse to top-left corner
			await page.mouse.move(0, 0);

			const waitForMouseMove = page.evaluate(() => {
				if ((window as unknown as TestCaseWindow).ignoreMouseMove) { return Promise.resolve(); }
				return new Promise<number[]>((resolve: (value: number[]) => void) => {
					const chart = (window as unknown as TestCaseWindow).chart;
					if (!chart) {
						throw new Error('window variable `chart` is required unless `ignoreMouseMove` is set to true');
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

			return PNG.sync.read(await page.screenshot({ encoding: 'binary' }) as Buffer);
		} finally {
			if (page !== undefined) {
				await page.close();
			}
		}
	}
}
