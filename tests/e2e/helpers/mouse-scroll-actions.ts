import { ElementHandle, Page } from 'puppeteer';

export async function centerMouseOnElement(
	page: Page,
	element: ElementHandle
): Promise<void> {
	const boundingBox = await element.boundingBox();
	if (!boundingBox) {
		throw new Error('Unable to get boundingBox for element.');
	}

	// move mouse to center of element
	await page.mouse.move(
		boundingBox.x + boundingBox.width / 2,
		boundingBox.y + boundingBox.height / 2
	);
}

interface MouseScrollDelta {
	x?: number;
	y?: number;
}

export async function doMouseScroll(
	deltas: MouseScrollDelta,
	page: Page
): Promise<void> {
	await page.mouse.wheel({ deltaX: deltas.x || 0, deltaY: deltas.y || 0 });
}

export async function doMouseScrolls(
	page: Page,
	element: ElementHandle
): Promise<void> {
	await centerMouseOnElement(page, element);

	await doMouseScroll({ x: 10.0 }, page);

	await doMouseScroll({ y: 10.0 }, page);

	await doMouseScroll({ x: -10.0 }, page);

	await doMouseScroll({ y: -10.0 }, page);

	await doMouseScroll({ x: 10.0, y: 10.0 }, page);

	await doMouseScroll({ x: -10.0, y: -10.0 }, page);
}
