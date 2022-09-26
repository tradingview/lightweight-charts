import { Page } from 'puppeteer';

// await a setTimeout delay evaluated within page context
export async function pageTimeout(page: Page, delay: number): Promise<void> {
	return page.evaluate(
		(ms: number) => new Promise<void>(
			(resolve: () => void) => setTimeout(resolve, ms)
			),
		delay
	);
}
