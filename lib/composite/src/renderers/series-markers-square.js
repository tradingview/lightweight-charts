"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hitTestSquare = exports.drawSquare = void 0;
const series_markers_utils_1 = require("./series-markers-utils");
function drawSquare(ctx, coords, size) {
    const squareSize = (0, series_markers_utils_1.shapeSize)('square', size);
    const halfSize = ((squareSize - 1) * coords.pixelRatio) / 2;
    const left = coords.x - halfSize;
    const top = coords.y - halfSize;
    ctx.fillRect(left, top, squareSize * coords.pixelRatio, squareSize * coords.pixelRatio);
}
exports.drawSquare = drawSquare;
function hitTestSquare(centerX, centerY, size, x, y) {
    const squareSize = (0, series_markers_utils_1.shapeSize)('square', size);
    const halfSize = (squareSize - 1) / 2;
    const left = centerX - halfSize;
    const top = centerY - halfSize;
    return x >= left && x <= left + squareSize &&
        y >= top && y <= top + squareSize;
}
exports.hitTestSquare = hitTestSquare;
