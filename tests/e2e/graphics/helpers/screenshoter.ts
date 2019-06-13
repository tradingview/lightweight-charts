/// <reference types="node" />

import { PNG } from 'pngjs';
import {
	Browser,
	launch as launchPuppeteer,
	LaunchOptions,
	Response,
} from 'puppeteer';

export class Screenshoter {
	private _browserPromise: Promise<Browser>;

	public constructor(noSandbox: boolean) {
		const puppeteerOptions: LaunchOptions = {};
		if (noSandbox) {
			puppeteerOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
		}

		this._browserPromise = launchPuppeteer(puppeteerOptions);
	}

	public async close(): Promise<void> {
		const browser = await this._browserPromise;
		delete this._browserPromise;
		await browser.close();
	}

	public async generateScreenshot(pageContent: string): Promise<PNG> {
		let page;

		try {
			const browser = await this._browserPromise;
			page = await browser.newPage();

			const width = 600;
			const height = 600;
			await page.setViewport({ width, height });

			const errors: string[] = [];
			page.on('pageerror', (error: Error) => {
				errors.push(error.message);
			});

			page.on('response', (response: Response) => {
				if (!response.ok()) {
					errors.push(`Network error: ${response.url()} status=${response.status()}`);
				}
			});

			await page.setContent(pageContent, { waitUntil: 'load' });

			// to avoid random cursor position
			await page.mouse.move(width / 2, height / 2);

			// let's wait until the next af to make sure that everything is repainted
			await page.evaluate(() => {
				return new Promise((resolve: () => void) => {
					window.requestAnimationFrame(() => {
						// and a little more time after af :)
						setTimeout(resolve, 50);
					});
				});
			});

			if (errors.length !== 0) {
				throw new Error(`Page has errors:\n${errors.join('\n')}`);
			}

			return PNG.sync.read(await page.screenshot({ encoding: 'binary' }));
		} finally {
			if (page !== undefined) {
				await page.close();
			}
		}
	}
}
