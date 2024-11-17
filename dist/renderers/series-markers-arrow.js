import { ceiledOdd } from '../helpers/mathex';
import { hitTestSquare } from './series-markers-square';
import { shapeSize } from './series-markers-utils';
export function drawArrow(up, ctx, coords, size) {
    const arrowSize = shapeSize('arrowUp', size);
    const halfArrowSize = ((arrowSize - 1) / 2) * coords.pixelRatio;
    const baseSize = ceiledOdd(size / 2);
    const halfBaseSize = ((baseSize - 1) / 2) * coords.pixelRatio;
    ctx.beginPath();
    if (up) {
        ctx.moveTo(coords.x - halfArrowSize, coords.y);
        ctx.lineTo(coords.x, coords.y - halfArrowSize);
        ctx.lineTo(coords.x + halfArrowSize, coords.y);
        ctx.lineTo(coords.x + halfBaseSize, coords.y);
        ctx.lineTo(coords.x + halfBaseSize, coords.y + halfArrowSize);
        ctx.lineTo(coords.x - halfBaseSize, coords.y + halfArrowSize);
        ctx.lineTo(coords.x - halfBaseSize, coords.y);
    }
    else {
        ctx.moveTo(coords.x - halfArrowSize, coords.y);
        ctx.lineTo(coords.x, coords.y + halfArrowSize);
        ctx.lineTo(coords.x + halfArrowSize, coords.y);
        ctx.lineTo(coords.x + halfBaseSize, coords.y);
        ctx.lineTo(coords.x + halfBaseSize, coords.y - halfArrowSize);
        ctx.lineTo(coords.x - halfBaseSize, coords.y - halfArrowSize);
        ctx.lineTo(coords.x - halfBaseSize, coords.y);
    }
    ctx.fill();
}
export function hitTestArrow(up, centerX, centerY, size, x, y) {
    // TODO: implement arrow hit test
    return hitTestSquare(centerX, centerY, size, x, y);
}
