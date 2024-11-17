import { shapeSize } from './series-markers-utils';
export function drawSquare(ctx, coords, size) {
    const squareSize = shapeSize('square', size);
    const halfSize = ((squareSize - 1) * coords.pixelRatio) / 2;
    const left = coords.x - halfSize;
    const top = coords.y - halfSize;
    ctx.fillRect(left, top, squareSize * coords.pixelRatio, squareSize * coords.pixelRatio);
}
export function hitTestSquare(centerX, centerY, size, x, y) {
    const squareSize = shapeSize('square', size);
    const halfSize = (squareSize - 1) / 2;
    const left = centerX - halfSize;
    const top = centerY - halfSize;
    return x >= left && x <= left + squareSize &&
        y >= top && y <= top + squareSize;
}
