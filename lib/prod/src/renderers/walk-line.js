// eslint-disable-next-line max-params, complexity
export function walkLine(renderingScope, items, lineType, visibleRange, barWidth, 
// the values returned by styleGetter are compared using the operator !==,
// so if styleGetter returns objects, then styleGetter should return the same object for equal styles
styleGetter, finishStyledArea) {
    if (items.length === 0 || visibleRange.from >= items.length || visibleRange.to <= 0) {
        return;
    }
    const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope;
    const firstItem = items[visibleRange.from];
    let currentStyle = styleGetter(renderingScope, firstItem);
    let currentStyleFirstItem = firstItem;
    if (visibleRange.to - visibleRange.from < 2) {
        const halfBarWidth = barWidth / 2;
        ctx.beginPath();
        const item1 = { _internal_x: firstItem._internal_x - halfBarWidth, _internal_y: firstItem._internal_y };
        const item2 = { _internal_x: firstItem._internal_x + halfBarWidth, _internal_y: firstItem._internal_y };
        ctx.moveTo(item1._internal_x * horizontalPixelRatio, item1._internal_y * verticalPixelRatio);
        ctx.lineTo(item2._internal_x * horizontalPixelRatio, item2._internal_y * verticalPixelRatio);
        finishStyledArea(renderingScope, currentStyle, item1, item2);
    }
    else {
        const changeStyle = (newStyle, currentItem) => {
            finishStyledArea(renderingScope, currentStyle, currentStyleFirstItem, currentItem);
            ctx.beginPath();
            currentStyle = newStyle;
            currentStyleFirstItem = currentItem;
        };
        let currentItem = currentStyleFirstItem;
        ctx.beginPath();
        ctx.moveTo(firstItem._internal_x * horizontalPixelRatio, firstItem._internal_y * verticalPixelRatio);
        for (let i = visibleRange.from + 1; i < visibleRange.to; ++i) {
            currentItem = items[i];
            const itemStyle = styleGetter(renderingScope, currentItem);
            switch (lineType) {
                case 0 /* LineType.Simple */:
                    ctx.lineTo(currentItem._internal_x * horizontalPixelRatio, currentItem._internal_y * verticalPixelRatio);
                    break;
                case 1 /* LineType.WithSteps */:
                    ctx.lineTo(currentItem._internal_x * horizontalPixelRatio, items[i - 1]._internal_y * verticalPixelRatio);
                    if (itemStyle !== currentStyle) {
                        changeStyle(itemStyle, currentItem);
                        ctx.lineTo(currentItem._internal_x * horizontalPixelRatio, items[i - 1]._internal_y * verticalPixelRatio);
                    }
                    ctx.lineTo(currentItem._internal_x * horizontalPixelRatio, currentItem._internal_y * verticalPixelRatio);
                    break;
                case 2 /* LineType.Curved */: {
                    const [cp1, cp2] = getControlPoints(items, i - 1, i);
                    ctx.bezierCurveTo(cp1._internal_x * horizontalPixelRatio, cp1._internal_y * verticalPixelRatio, cp2._internal_x * horizontalPixelRatio, cp2._internal_y * verticalPixelRatio, currentItem._internal_x * horizontalPixelRatio, currentItem._internal_y * verticalPixelRatio);
                    break;
                }
            }
            if (lineType !== 1 /* LineType.WithSteps */ && itemStyle !== currentStyle) {
                changeStyle(itemStyle, currentItem);
                ctx.moveTo(currentItem._internal_x * horizontalPixelRatio, currentItem._internal_y * verticalPixelRatio);
            }
        }
        if (currentStyleFirstItem !== currentItem || currentStyleFirstItem === currentItem && lineType === 1 /* LineType.WithSteps */) {
            finishStyledArea(renderingScope, currentStyle, currentStyleFirstItem, currentItem);
        }
    }
}
const curveTension = 6;
function subtract(p1, p2) {
    return { _internal_x: p1._internal_x - p2._internal_x, _internal_y: p1._internal_y - p2._internal_y };
}
function add(p1, p2) {
    return { _internal_x: p1._internal_x + p2._internal_x, _internal_y: p1._internal_y + p2._internal_y };
}
function divide(p1, n) {
    return { _internal_x: p1._internal_x / n, _internal_y: p1._internal_y / n };
}
/**
 * @returns Two control points that can be used as arguments to {@link CanvasRenderingContext2D.bezierCurveTo} to draw a curved line between `points[fromPointIndex]` and `points[toPointIndex]`.
 */
export function getControlPoints(points, fromPointIndex, toPointIndex) {
    const beforeFromPointIndex = Math.max(0, fromPointIndex - 1);
    const afterToPointIndex = Math.min(points.length - 1, toPointIndex + 1);
    const cp1 = add(points[fromPointIndex], divide(subtract(points[toPointIndex], points[beforeFromPointIndex]), curveTension));
    const cp2 = subtract(points[toPointIndex], divide(subtract(points[afterToPointIndex], points[fromPointIndex]), curveTension));
    return [cp1, cp2];
}
