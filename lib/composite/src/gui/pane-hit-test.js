"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hitTestPane = void 0;
// returns true if item is above reference
function comparePrimitiveZOrder(item, reference) {
    return (!reference ||
        (item === 'top' && reference !== 'top') ||
        (item === 'normal' && reference === 'bottom'));
}
function findBestPrimitiveHitTest(sources, x, y) {
    var _a, _b;
    let bestPrimitiveHit;
    let bestHitSource;
    for (const source of sources) {
        const primitiveHitResults = (_b = (_a = source.primitiveHitTest) === null || _a === void 0 ? void 0 : _a.call(source, x, y)) !== null && _b !== void 0 ? _b : [];
        for (const hitResult of primitiveHitResults) {
            if (comparePrimitiveZOrder(hitResult.zOrder, bestPrimitiveHit === null || bestPrimitiveHit === void 0 ? void 0 : bestPrimitiveHit.zOrder)) {
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
function convertPrimitiveHitResult(primitiveHit) {
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
function hitTestPaneView(paneViews, x, y) {
    for (const paneView of paneViews) {
        const renderer = paneView.renderer();
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
function hitTestPane(pane, x, y) {
    const sources = pane.orderedSources();
    const bestPrimitiveHit = findBestPrimitiveHitTest(sources, x, y);
    if ((bestPrimitiveHit === null || bestPrimitiveHit === void 0 ? void 0 : bestPrimitiveHit.hit.zOrder) === 'top') {
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
        const sourceResult = hitTestPaneView(source.paneViews(pane), x, y);
        if (sourceResult !== null) {
            return {
                source: source,
                view: sourceResult.view,
                object: sourceResult.object,
            };
        }
        if (bestPrimitiveHit && bestPrimitiveHit.source === source && bestPrimitiveHit.hit.zOrder !== 'bottom' && bestPrimitiveHit.hit.isBackground) {
            return convertPrimitiveHitResult(bestPrimitiveHit);
        }
    }
    if (bestPrimitiveHit === null || bestPrimitiveHit === void 0 ? void 0 : bestPrimitiveHit.hit) {
        // return primitive hits for the 'bottom' layer
        return convertPrimitiveHitResult(bestPrimitiveHit);
    }
    return null;
}
exports.hitTestPane = hitTestPane;
