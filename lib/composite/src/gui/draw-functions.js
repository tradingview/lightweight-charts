"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drawSourcePaneViews = exports.drawForeground = exports.drawBackground = void 0;
function drawBackground(renderer, target, isHovered, hitTestData) {
    if (renderer.drawBackground) {
        renderer.drawBackground(target, isHovered, hitTestData);
    }
}
exports.drawBackground = drawBackground;
function drawForeground(renderer, target, isHovered, hitTestData) {
    renderer.draw(target, isHovered, hitTestData);
}
exports.drawForeground = drawForeground;
function drawSourcePaneViews(paneViewsGetter, drawRendererFn, source, pane) {
    const paneViews = paneViewsGetter(source, pane);
    for (const paneView of paneViews) {
        const renderer = paneView.renderer();
        if (renderer !== null) {
            drawRendererFn(renderer);
        }
    }
}
exports.drawSourcePaneViews = drawSourcePaneViews;
