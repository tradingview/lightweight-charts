import { BoundingBox, ElementHandle, Page } from 'puppeteer';

import { pageTimeout } from './page-timeout';

export async function doVerticalDrag(
	page: Page,
	element: ElementHandle
): Promise<void> {
	const elBox = (await element.boundingBox()) as BoundingBox;

	const elMiddleX = elBox.x + elBox.width / 2;
	const elMiddleY = elBox.y + elBox.height / 2;

	// move mouse to the middle of element
	await page.mouse.move(elMiddleX, elMiddleY);

	await page.mouse.down({ button: 'left' });
	await page.mouse.move(elMiddleX, elMiddleY - 20);
	await page.mouse.move(elMiddleX, elMiddleY + 40);
	await page.mouse.up({ button: 'left' });
}

export async function doHorizontalDrag(
	page: Page,
	element: ElementHandle
): Promise<void> {
	const elBox = (await element.boundingBox()) as BoundingBox;

	const elMiddleX = elBox.x + elBox.width / 2;
	const elMiddleY = elBox.y + elBox.height / 2;

	// move mouse to the middle of element
	await page.mouse.move(elMiddleX, elMiddleY);

	await page.mouse.down({ button: 'left' });
	await page.mouse.move(elMiddleX - 20, elMiddleY);
	await page.mouse.move(elMiddleX + 40, elMiddleY);
	await page.mouse.up({ button: 'left' });
}

export async function doKineticAnimation(
	page: Page,
	element: ElementHandle
): Promise<void> {
	const elBox = (await element.boundingBox()) as BoundingBox;

	const elMiddleX = elBox.x + elBox.width / 2;
	const elMiddleY = elBox.y + elBox.height / 2;

	// move mouse to the middle of element
	await page.mouse.move(elMiddleX, elMiddleY);

	await page.mouse.down({ button: 'left' });
	await pageTimeout(page, 50);
	await page.mouse.move(elMiddleX - 40, elMiddleY);
	await page.mouse.move(elMiddleX - 55, elMiddleY);
	await page.mouse.move(elMiddleX - 105, elMiddleY);
	await page.mouse.move(elMiddleX - 155, elMiddleY);
	await page.mouse.move(elMiddleX - 205, elMiddleY);
	await page.mouse.move(elMiddleX - 255, elMiddleY);
	await page.mouse.up({ button: 'left' });

	await pageTimeout(page, 200);
	// stop animation
	await page.mouse.down({ button: 'left' });
	await page.mouse.up({ button: 'left' });
}
