"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hitTestCircle = exports.drawCircle = void 0;
const series_markers_utils_1 = require("./series-markers-utils");
function drawCircle(ctx, coords, size) {
    const circleSize = (0, series_markers_utils_1.shapeSize)('circle', size);
    const halfSize = (circleSize - 1) / 2;
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, halfSize * coords.pixelRatio, 0, 2 * Math.PI, false);
    ctx.fill();
}
exports.drawCircle = drawCircle;
function hitTestCircle(centerX, centerY, size, x, y) {
    const circleSize = (0, series_markers_utils_1.shapeSize)('circle', size);
    const tolerance = 2 + circleSize / 2;
    const xOffset = centerX - x;
    const yOffset = centerY - y;
    const dist = Math.sqrt(xOffset * xOffset + yOffset * yOffset);
    return dist <= tolerance;
}
exports.hitTestCircle = hitTestCircle;
