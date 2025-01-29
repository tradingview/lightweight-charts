import { ElementHandle, Page } from 'puppeteer';

import {
	doHorizontalDrag,
	doKineticAnimation,
	doVerticalDrag,
} from './mouse-drag-actions';
import { doMouseScroll } from './mouse-scroll-actions';
import { pageTimeout } from './page-timeout';
import { doLongTouch, doPinchZoomTouch, doSwipeTouch } from './touch-actions';
import { doZoomInZoomOut } from './zoom-action';

export type InteractionAction =
	| 'scrollLeft'
	| 'scrollRight'
	| 'scrollUp'
	| 'scrollDown'
	| 'scrollUpRight'
	| 'scrollDownLeft'
	| 'click'
	| 'doubleClick'
	| 'outsideClick'
	| 'viewportZoomInOut'
	| 'verticalDrag'
	| 'horizontalDrag'
	| 'tap'
	| 'longTouch'
	| 'pinchZoomIn'
	| 'pinchZoomOut'
	| 'swipeTouchVertical'
	| 'swipeTouchHorizontal'
	| 'swipeTouchDiagonal'
	| 'kineticAnimation'
	| 'moveMouseCenter'
	| 'moveMouseTopLeft'
	| 'moveMouseBottomRight'
	| 'clickXY';
export type InteractionTarget =
	| 'container'
	| 'timescale'
	| 'leftpricescale'
	| 'rightpricescale'
	| 'pane'
	| 'paneSeparator';

export type Interaction = {
	action: InteractionAction;
	target?: InteractionTarget;
} & ({
	action: Omit<InteractionAction, 'clickXY'>;
	options: never;
} | {
	action: 'clickXY';
	options: {
		x: number;
		y: number;
	};
});

// eslint-disable-next-line complexity
async function performAction(
	interaction: Interaction,
	page: Page,
	target: ElementHandle<Element>
): Promise<void> {
	const action = interaction.action;
	switch (action) {
		case 'scrollLeft':
			await doMouseScroll({ x: -10.0 }, page);
			break;
		case 'scrollRight':
			await doMouseScroll({ x: 10.0 }, page);
			break;
		case 'scrollDown':
			await doMouseScroll({ y: 10.0 }, page);
			break;
		case 'scrollUp':
			await doMouseScroll({ y: -10.0 }, page);
			break;
		case 'scrollUpRight':
			await doMouseScroll({ y: 10.0, x: 10.0 }, page);
			break;
		case 'scrollDownLeft':
			await doMouseScroll({ y: -10.0, x: -10.0 }, page);
			break;
		case 'click':
			await target.click({ button: 'left' });
			break;
		case 'doubleClick':
			await target.click({ button: 'left' });
			await pageTimeout(page, 200);
			await target.click({ button: 'left' });
			break;
		case 'outsideClick':
			{
				const boundingBox = await target.boundingBox();
				if (boundingBox) {
					await page.mouse.click(
						boundingBox.x + boundingBox.width + 20,
						boundingBox.y + boundingBox.height + 50,
						{ button: 'left' }
					);
				}
			}
			break;
		case 'clickXY':
			{
				const boundingBox = await target.boundingBox();
				if (boundingBox) {
					await page.mouse.click(
						boundingBox.x + interaction.options.x,
						boundingBox.y + interaction.options.y
					);
				}
			}
			break;
		case 'viewportZoomInOut':
			await doZoomInZoomOut(page);
			break;
		case 'verticalDrag':
			await doVerticalDrag(page, target);
			break;
		case 'horizontalDrag':
			await doHorizontalDrag(page, target);
			break;

		case 'tap':
			{
				const boundingBox = await target.boundingBox();
				if (boundingBox) {
					await page.touchscreen.tap(
						boundingBox.x + boundingBox.width / 2,
						boundingBox.y + boundingBox.height / 2
					);
				}
			}
			break;
		case 'longTouch':
			await doLongTouch(page, target, 500);
			break;
		case 'pinchZoomIn':
			{
				const devToolsSession = await page.createCDPSession();
				await doPinchZoomTouch(devToolsSession, target, true);
			}
			break;
		case 'pinchZoomOut':
			{
				const devToolsSession = await page.createCDPSession();
				await doPinchZoomTouch(devToolsSession, target);
			}
			break;
		case 'swipeTouchHorizontal':
			{
				const devToolsSession = await page.createCDPSession();
				await doSwipeTouch(devToolsSession, target, { horizontal: true });
			}
			break;
		case 'swipeTouchVertical':
			{
				const devToolsSession = await page.createCDPSession();
				await doSwipeTouch(devToolsSession, target, { vertical: true });
			}
			break;
		case 'swipeTouchDiagonal':
			{
				const devToolsSession = await page.createCDPSession();
				await doSwipeTouch(devToolsSession, target, {
					vertical: true,
					horizontal: true,
				});
			}
			break;
		case 'kineticAnimation':
			await doKineticAnimation(page, target);
			break;
		case 'moveMouseCenter':
			{
				const boundingBox = await target.boundingBox();
				if (boundingBox) {
					await page.mouse.move(boundingBox.width / 2, boundingBox.height / 2);
				}
			}
			break;
		case 'moveMouseTopLeft':
			{
				const boundingBox = await target.boundingBox();
				if (boundingBox) {
					await page.mouse.move(boundingBox.x, boundingBox.y);
				}
			}
			break;
		case 'moveMouseBottomRight':
			{
				const boundingBox = await target.boundingBox();
				if (boundingBox) {
					await page.mouse.move(
						boundingBox.x + boundingBox.width,
						boundingBox.y + boundingBox.height
					);
				}
			}
			break;
		default: {
			const exhaustiveCheck: never = action;
			throw new Error(exhaustiveCheck);
		}
	}
}

export async function performInteractions(
	page: Page,
	interactionsToPerform: Interaction[]
): Promise<void> {
	const chartContainer = (await page.$('#container')) as ElementHandle<Element>;
	const leftPriceAxis = (
		await chartContainer.$$('tr:nth-of-type(1) td:nth-of-type(1) div canvas')
	)[0];
	const paneWidget = (
		await chartContainer.$$('tr:nth-of-type(1) td:nth-of-type(2) div canvas')
	)[0];
	const rightPriceAxis = (
		await chartContainer.$$('tr:nth-of-type(1) td:nth-of-type(3) div canvas')
	)[0];
	const timeAxis = (
		await chartContainer.$$('tr:nth-of-type(2) td:nth-of-type(2) div canvas')
	)[0];
	const paneSeparator = (
		await chartContainer.$$('tr:nth-of-type(2) td div:nth-of-type(2)')
	)[0];

	for (const interaction of interactionsToPerform) {
		let target: ElementHandle<Element>;
		switch (interaction.target) {
			case undefined:
			case 'container':
				target = chartContainer;
				break;
			case 'leftpricescale':
				target = leftPriceAxis;
				break;
			case 'rightpricescale':
				target = rightPriceAxis;
				break;
			case 'timescale':
				target = timeAxis;
				break;
			case 'pane':
				target = paneWidget;
				break;
			case 'paneSeparator':
				target = paneSeparator;
				break;
			default: {
				const exhaustiveCheck: never = interaction.target;
				throw new Error(exhaustiveCheck);
			}
		}

		await performAction(interaction, page, target);
	}
}

interface InternalWindowForInteractions {
	initialInteractionsToPerform: () => Interaction[];
	finalInteractionsToPerform: () => Interaction[];
	afterInitialInteractions?: () => void;
	afterFinalInteractions?: () => void;
}

export async function runInteractionsOnPage(page: Page): Promise<void> {
	const initialInteractionsToPerform = await page.evaluate(() => {
		if (!(window as unknown as InternalWindowForInteractions).initialInteractionsToPerform) {
			return [];
		}
		return (window as unknown as InternalWindowForInteractions).initialInteractionsToPerform();
	});

	await performInteractions(page, initialInteractionsToPerform);

	await page.evaluate(() => {
		if ((window as unknown as InternalWindowForInteractions).afterInitialInteractions) {
			return (
				window as unknown as InternalWindowForInteractions
			).afterInitialInteractions?.();
		}
		return new Promise<void>((resolve: () => void) => {
			window.requestAnimationFrame(() => {
				setTimeout(resolve, 50);
			});
		});
	});

	const finalInteractionsToPerform = await page.evaluate(() => {
		if (!(window as unknown as InternalWindowForInteractions).finalInteractionsToPerform) {
			return [];
		}
		return (window as unknown as InternalWindowForInteractions).finalInteractionsToPerform();
	});

	if (finalInteractionsToPerform && finalInteractionsToPerform.length > 0) {
		await performInteractions(page, finalInteractionsToPerform);
	}

	await page.evaluate(() => {
		return new Promise<void>((resolve: () => void) => {
			(window as unknown as InternalWindowForInteractions).afterFinalInteractions?.();
			window.requestAnimationFrame(() => {
				setTimeout(resolve, 50);
			});
		});
	});
}
