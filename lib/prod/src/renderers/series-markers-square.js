import { shapeSize } from './series-markers-utils';
export function drawSquare(ctx, coords, size) {
    const squareSize = shapeSize('square', size);
    const halfSize = ((squareSize - 1) * coords._internal_pixelRatio) / 2;
    const left = coords._internal_x - halfSize;
    const top = coords._internal_y - halfSize;
    ctx.fillRect(left, top, squareSize * coords._internal_pixelRatio, squareSize * coords._internal_pixelRatio);
}
export function hitTestSquare(centerX, centerY, size, x, y) {
    const squareSize = shapeSize('square', size);
    const halfSize = (squareSize - 1) / 2;
    const left = centerX - halfSize;
    const top = centerY - halfSize;
    return x >= left && x <= left + squareSize &&
        y >= top && y <= top + squareSize;
}
