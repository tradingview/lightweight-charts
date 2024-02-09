"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hitTestText = exports.drawText = void 0;
function drawText(ctx, text, x, y, horizontalPixelRatio, verticalPixelRatio) {
    ctx.save();
    ctx.scale(horizontalPixelRatio, verticalPixelRatio);
    ctx.fillText(text, x, y);
    ctx.restore();
}
exports.drawText = drawText;
function hitTestText(textX, textY, textWidth, textHeight, x, y) {
    const halfHeight = textHeight / 2;
    return x >= textX && x <= textX + textWidth &&
        y >= textY - halfHeight && y <= textY + halfHeight;
}
exports.hitTestText = hitTestText;
