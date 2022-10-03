import { Page } from 'puppeteer';

export async function doZoomInZoomOut(page: Page): Promise<void> {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const prevViewport = page.viewport()!;
	await page.setViewport({
		...prevViewport,
		deviceScaleFactor: 2,
	});

	await page.setViewport(prevViewport);
}
