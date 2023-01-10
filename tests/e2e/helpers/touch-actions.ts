import { BoundingBox, ElementHandle, Page, type CDPSession } from 'puppeteer';

import { pageTimeout } from './page-timeout';

// Simulate a long touch action in a single position
export async function doLongTouch(page: Page, element: ElementHandle, duration: number): Promise<void> {
	const elBox = (await element.boundingBox()) as BoundingBox;

	const elCenterX = elBox.x + elBox.width / 2;
	const elCenterY = elBox.y + elBox.height / 2;

	const client = await page.target().createCDPSession();

	await client.send('Input.dispatchTouchEvent', {
		type: 'touchStart',
		touchPoints: [
			{ x: elCenterX, y: elCenterY },
		],
	});
	await pageTimeout(page, duration);
	return client.send('Input.dispatchTouchEvent', {
		type: 'touchEnd',
		touchPoints: [
			{ x: elCenterX, y: elCenterY },
		],
	});
}

// Simulate a touch swipe gesture
export async function doSwipeTouch(
	devToolsSession: CDPSession,
	element: ElementHandle,
	{
		horizontal = false,
		vertical = false,
	}: { horizontal?: boolean; vertical?: boolean }
): Promise<void> {
	const elBox = (await element.boundingBox()) as BoundingBox;

	const elCenterX = elBox.x + elBox.width / 2;
	const elCenterY = elBox.y + elBox.height / 2;
	const xStep = horizontal ? elBox.width / 8 : 0;
	const yStep = vertical ? elBox.height / 8 : 0;

	for (let i = 2; i > 0; i--) {
		const type = i === 2 ? 'touchStart' : 'touchMove';
		await devToolsSession.send('Input.dispatchTouchEvent', {
			type,
			touchPoints: [{ x: elCenterX - i * xStep, y: elCenterY - i * yStep }],
		});
	}
	return devToolsSession.send('Input.dispatchTouchEvent', {
		type: 'touchEnd',
		touchPoints: [{ x: elCenterX - xStep, y: elCenterY - yStep }],
	});
}

// Perform a pinch or zoom touch gesture within the specified element.
export async function doPinchZoomTouch(
	devToolsSession: CDPSession,
	element: ElementHandle,
	zoom?: boolean
): Promise<void> {
	const elBox = (await element.boundingBox()) as BoundingBox;

	const sign = zoom ? -1 : 1;
	const elCenterX = elBox.x + elBox.width / 2;
	const elCenterY = elBox.y + elBox.height / 2;
	const xStep = (sign * elBox.width) / 8;
	const yStep = (sign * elBox.height) / 8;

	for (let i = 2; i > 0; i--) {
		const type = i === 2 ? 'touchStart' : 'touchMove';
		await devToolsSession.send('Input.dispatchTouchEvent', {
			type,
			touchPoints: [
				{ x: elCenterX - i * xStep, y: elCenterY - i * yStep },
				{ x: elCenterX + i * xStep, y: elCenterY + i * xStep },
			],
		});
	}
	return devToolsSession.send('Input.dispatchTouchEvent', {
		type: 'touchEnd',
		touchPoints: [
			{ x: elCenterX - xStep, y: elCenterY - yStep },
			{ x: elCenterX + xStep, y: elCenterY + xStep },
		],
	});
}
