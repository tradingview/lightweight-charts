import { ceiledOdd } from '../helpers/mathex';
import { hitTestSquare } from './series-markers-square';
import { shapeSize } from './series-markers-utils';
export function drawArrow(up, ctx, coords, size) {
    const arrowSize = shapeSize('arrowUp', size);
    const halfArrowSize = ((arrowSize - 1) / 2) * coords._internal_pixelRatio;
    const baseSize = ceiledOdd(size / 2);
    const halfBaseSize = ((baseSize - 1) / 2) * coords._internal_pixelRatio;
    ctx.beginPath();
    if (up) {
        ctx.moveTo(coords._internal_x - halfArrowSize, coords._internal_y);
        ctx.lineTo(coords._internal_x, coords._internal_y - halfArrowSize);
        ctx.lineTo(coords._internal_x + halfArrowSize, coords._internal_y);
        ctx.lineTo(coords._internal_x + halfBaseSize, coords._internal_y);
        ctx.lineTo(coords._internal_x + halfBaseSize, coords._internal_y + halfArrowSize);
        ctx.lineTo(coords._internal_x - halfBaseSize, coords._internal_y + halfArrowSize);
        ctx.lineTo(coords._internal_x - halfBaseSize, coords._internal_y);
    }
    else {
        ctx.moveTo(coords._internal_x - halfArrowSize, coords._internal_y);
        ctx.lineTo(coords._internal_x, coords._internal_y + halfArrowSize);
        ctx.lineTo(coords._internal_x + halfArrowSize, coords._internal_y);
        ctx.lineTo(coords._internal_x + halfBaseSize, coords._internal_y);
        ctx.lineTo(coords._internal_x + halfBaseSize, coords._internal_y - halfArrowSize);
        ctx.lineTo(coords._internal_x - halfBaseSize, coords._internal_y - halfArrowSize);
        ctx.lineTo(coords._internal_x - halfBaseSize, coords._internal_y);
    }
    ctx.fill();
}
export function hitTestArrow(up, centerX, centerY, size, x, y) {
    // TODO: implement arrow hit test
    return hitTestSquare(centerX, centerY, size, x, y);
}
