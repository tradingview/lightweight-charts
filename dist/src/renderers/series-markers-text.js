export function drawText(ctx, text, x, y, horizontalPixelRatio, verticalPixelRatio) {
    ctx.save();
    ctx.scale(horizontalPixelRatio, verticalPixelRatio);
    ctx.fillText(text, x, y);
    ctx.restore();
}
export function hitTestText(textX, textY, textWidth, textHeight, x, y) {
    const halfHeight = textHeight / 2;
    return x >= textX && x <= textX + textWidth &&
        y >= textY - halfHeight && y <= textY + halfHeight;
}
