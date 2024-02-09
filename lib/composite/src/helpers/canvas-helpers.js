"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRectWithGradient = exports.drawRoundRectWithInnerBorder = exports.drawRoundRect = exports.clearRect = exports.fillRectInnerBorder = void 0;
/**
 * Fills rectangle's inner border (so, all the filled area is limited by the [x, x + width]*[y, y + height] region)
 * ```
 * (x, y)
 * O***********************|*****
 * |        border         |  ^
 * |   *****************   |  |
 * |   |               |   |  |
 * | b |               | b |  h
 * | o |               | o |  e
 * | r |               | r |  i
 * | d |               | d |  g
 * | e |               | e |  h
 * | r |               | r |  t
 * |   |               |   |  |
 * |   *****************   |  |
 * |        border         |  v
 * |***********************|*****
 * |                       |
 * |<------- width ------->|
 * ```
 *
 * @param ctx - Context to draw on
 * @param x - Left side of the target rectangle
 * @param y - Top side of the target rectangle
 * @param width - Width of the target rectangle
 * @param height - Height of the target rectangle
 * @param borderWidth - Width of border to fill, must be less than width and height of the target rectangle
 */
function fillRectInnerBorder(ctx, x, y, width, height, borderWidth) {
    // horizontal (top and bottom) edges
    ctx.fillRect(x + borderWidth, y, width - borderWidth * 2, borderWidth);
    ctx.fillRect(x + borderWidth, y + height - borderWidth, width - borderWidth * 2, borderWidth);
    // vertical (left and right) edges
    ctx.fillRect(x, y, borderWidth, height);
    ctx.fillRect(x + width - borderWidth, y, borderWidth, height);
}
exports.fillRectInnerBorder = fillRectInnerBorder;
function clearRect(ctx, x, y, w, h, clearColor) {
    ctx.save();
    ctx.globalCompositeOperation = 'copy';
    ctx.fillStyle = clearColor;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
}
exports.clearRect = clearRect;
function changeBorderRadius(borderRadius, offset) {
    return borderRadius.map((x) => x === 0 ? x : x + offset);
}
function drawRoundRect(
// eslint:disable-next-line:max-params
ctx, x, y, w, h, radii) {
    /**
     * As of May 2023, all of the major browsers now support ctx.roundRect() so we should
     * be able to switch to the native version soon.
     */
    ctx.beginPath();
    ctx.lineTo(x + w - radii[1], y);
    if (radii[1] !== 0) {
        ctx.arcTo(x + w, y, x + w, y + radii[1], radii[1]);
    }
    ctx.lineTo(x + w, y + h - radii[2]);
    if (radii[2] !== 0) {
        ctx.arcTo(x + w, y + h, x + w - radii[2], y + h, radii[2]);
    }
    ctx.lineTo(x + radii[3], y + h);
    if (radii[3] !== 0) {
        ctx.arcTo(x, y + h, x, y + h - radii[3], radii[3]);
    }
    ctx.lineTo(x, y + radii[0]);
    if (radii[0] !== 0) {
        ctx.arcTo(x, y, x + radii[0], y, radii[0]);
    }
}
exports.drawRoundRect = drawRoundRect;
// eslint-disable-next-line max-params
function drawRoundRectWithInnerBorder(ctx, left, top, width, height, backgroundColor, borderWidth = 0, borderRadius = [0, 0, 0, 0], borderColor = '') {
    ctx.save();
    if (!borderWidth || !borderColor || borderColor === backgroundColor) {
        drawRoundRect(ctx, left, top, width, height, borderRadius);
        ctx.fillStyle = backgroundColor;
        ctx.fill();
        ctx.restore();
        return;
    }
    const halfBorderWidth = borderWidth / 2;
    // Draw body
    if (backgroundColor !== 'transparent') {
        const innerRadii = changeBorderRadius(borderRadius, -borderWidth);
        drawRoundRect(ctx, left + borderWidth, top + borderWidth, width - borderWidth * 2, height - borderWidth * 2, innerRadii);
        ctx.fillStyle = backgroundColor;
        ctx.fill();
    }
    // Draw border
    if (borderColor !== 'transparent') {
        const outerRadii = changeBorderRadius(borderRadius, -halfBorderWidth);
        drawRoundRect(ctx, left + halfBorderWidth, top + halfBorderWidth, width - borderWidth, height - borderWidth, outerRadii);
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = borderColor;
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();
}
exports.drawRoundRectWithInnerBorder = drawRoundRectWithInnerBorder;
// eslint-disable-next-line max-params
function clearRectWithGradient(ctx, x, y, w, h, topColor, bottomColor) {
    ctx.save();
    ctx.globalCompositeOperation = 'copy';
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
}
exports.clearRectWithGradient = clearRectWithGradient;
