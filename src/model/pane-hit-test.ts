import { IPaneView } from '../views/pane/ipane-view';

import { HoveredObject } from './chart-model';
import { Coordinate } from './coordinate';
import { IDataSource, IPrimitiveHitTestSource } from './idata-source';
import { PrimitiveHoveredItem, PrimitivePaneViewZOrder } from './ipane-primitive';
import { Pane } from './pane';

export interface HitTestResult {
	source: IPrimitiveHitTestSource;
	object?: HoveredObject;
	view?: IPaneView;
	cursorStyle?: string;
}

export interface HitTestPaneViewResult {
	view: IPaneView;
	object?: HoveredObject;
}

interface BestPrimitiveHit {
	hit: PrimitiveHoveredItem;
	source: IPrimitiveHitTestSource;
}

// returns true if item is above reference
function comparePrimitiveZOrder(
	item: PrimitivePaneViewZOrder,
	reference?: PrimitivePaneViewZOrder
): boolean {
	return (
		!reference ||
		(item === 'top' && reference !== 'top') ||
		(item === 'normal' && reference === 'bottom')
	);
}

function findBestPrimitiveHitTest(
	sources: readonly IPrimitiveHitTestSource[],
	x: Coordinate,
	y: Coordinate
): BestPrimitiveHit | null {
	let bestPrimitiveHit: PrimitiveHoveredItem | undefined;
	let bestHitSource: IPrimitiveHitTestSource | undefined;
	for (const source of sources) {
		const primitiveHitResults = source.primitiveHitTest?.(x, y) ?? [];
		for (const hitResult of primitiveHitResults) {
			if (comparePrimitiveZOrder(hitResult.zOrder, bestPrimitiveHit?.zOrder)) {
				bestPrimitiveHit = hitResult;
				bestHitSource = source;
			}
		}
	}
	if (!bestPrimitiveHit || !bestHitSource) {
		return null;
	}
	return {
		hit: bestPrimitiveHit,
		source: bestHitSource,
	};
}

function convertPrimitiveHitResult(
	primitiveHit: BestPrimitiveHit
): HitTestResult {
	return {
		source: primitiveHit.source,
		object: {
			externalId: primitiveHit.hit.externalId,
		},
		cursorStyle: primitiveHit.hit.cursorStyle,
	};
}

/**
 * Performs a hit test on a collection of pane views to determine which view and object
 * is located at a given coordinate (x, y) and returns the matching pane view and
 * hit-tested result object, or null if no match is found.
 */
function hitTestPaneView(
	paneViews: readonly IPaneView[],
	x: Coordinate,
	y: Coordinate,
	pane: Pane
): HitTestPaneViewResult | null {
	for (const paneView of paneViews) {
		const renderer = paneView.renderer(pane);
		if (renderer !== null && renderer.hitTest) {
			const result = renderer.hitTest(x, y);
			if (result !== null) {
				return {
					view: paneView,
					object: result,
				};
			}
		}
	}

	return null;
}

function isDataSource(source: IPrimitiveHitTestSource): source is IDataSource {
	return (source as IDataSource).paneViews !== undefined;
}

// eslint-disable-next-line complexity
export function hitTestPane(
	pane: Pane,
	x: Coordinate,
	y: Coordinate
): HitTestResult | null {
	const sources: IPrimitiveHitTestSource[] = [pane, ...pane.orderedSources()];
	const bestPrimitiveHit = findBestPrimitiveHitTest(sources, x, y);
	if (bestPrimitiveHit?.hit.zOrder === 'top') {
        // a primitive hit on the 'top' layer will always beat the built-in hit tests
        // (on normal layer) so we can return early here.
		return convertPrimitiveHitResult(bestPrimitiveHit);
	}
	for (const source of sources) {
		if (bestPrimitiveHit && bestPrimitiveHit.source === source && bestPrimitiveHit.hit.zOrder !== 'bottom' && !bestPrimitiveHit.hit.isBackground) {
            // a primitive will be drawn above a built-in item like a series marker
            // therefore it takes precedence here.
			return convertPrimitiveHitResult(bestPrimitiveHit);
		}
		if (isDataSource(source)) {
			const sourceResult = hitTestPaneView(source.paneViews(pane), x, y, pane);
			if (sourceResult !== null) {
				return {
					source: source,
					view: sourceResult.view,
					object: sourceResult.object,
				};
			}
		}
		if (bestPrimitiveHit && bestPrimitiveHit.source === source && bestPrimitiveHit.hit.zOrder !== 'bottom' && bestPrimitiveHit.hit.isBackground) {
			return convertPrimitiveHitResult(bestPrimitiveHit);
		}
	}
	if (bestPrimitiveHit?.hit) {
        // return primitive hits for the 'bottom' layer
		return convertPrimitiveHitResult(bestPrimitiveHit);
	}

	return null;
}
