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
        const primitiveHitResults = (_b = (_a = source._internal_primitiveHitTest) === null || _a === void 0 ? void 0 : _a.call(source, x, y)) !== null && _b !== void 0 ? _b : [];
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
        _internal_hit: bestPrimitiveHit,
        _internal_source: bestHitSource,
    };
}
function convertPrimitiveHitResult(primitiveHit) {
    return {
        _internal_source: primitiveHit._internal_source,
        _internal_object: {
            _internal_externalId: primitiveHit._internal_hit.externalId,
        },
        _internal_cursorStyle: primitiveHit._internal_hit.cursorStyle,
    };
}
/**
 * Performs a hit test on a collection of pane views to determine which view and object
 * is located at a given coordinate (x, y) and returns the matching pane view and
 * hit-tested result object, or null if no match is found.
 */
function hitTestPaneView(paneViews, x, y) {
    for (const paneView of paneViews) {
        const renderer = paneView._internal_renderer();
        if (renderer !== null && renderer._internal_hitTest) {
            const result = renderer._internal_hitTest(x, y);
            if (result !== null) {
                return {
                    _internal_view: paneView,
                    _internal_object: result,
                };
            }
        }
    }
    return null;
}
export function hitTestPane(pane, x, y) {
    const sources = pane._internal_orderedSources();
    const bestPrimitiveHit = findBestPrimitiveHitTest(sources, x, y);
    if ((bestPrimitiveHit === null || bestPrimitiveHit === void 0 ? void 0 : bestPrimitiveHit._internal_hit.zOrder) === 'top') {
        // a primitive hit on the 'top' layer will always beat the built-in hit tests
        // (on normal layer) so we can return early here.
        return convertPrimitiveHitResult(bestPrimitiveHit);
    }
    for (const source of sources) {
        if (bestPrimitiveHit && bestPrimitiveHit._internal_source === source && bestPrimitiveHit._internal_hit.zOrder !== 'bottom' && !bestPrimitiveHit._internal_hit.isBackground) {
            // a primitive will be drawn above a built-in item like a series marker
            // therefore it takes precedence here.
            return convertPrimitiveHitResult(bestPrimitiveHit);
        }
        const sourceResult = hitTestPaneView(source._internal_paneViews(pane), x, y);
        if (sourceResult !== null) {
            return {
                _internal_source: source,
                _internal_view: sourceResult._internal_view,
                _internal_object: sourceResult._internal_object,
            };
        }
        if (bestPrimitiveHit && bestPrimitiveHit._internal_source === source && bestPrimitiveHit._internal_hit.zOrder !== 'bottom' && bestPrimitiveHit._internal_hit.isBackground) {
            return convertPrimitiveHitResult(bestPrimitiveHit);
        }
    }
    if (bestPrimitiveHit === null || bestPrimitiveHit === void 0 ? void 0 : bestPrimitiveHit._internal_hit) {
        // return primitive hits for the 'bottom' layer
        return convertPrimitiveHitResult(bestPrimitiveHit);
    }
    return null;
}
