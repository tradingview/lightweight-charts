export function drawBackground(renderer, target, isHovered, hitTestData) {
    if (renderer._internal_drawBackground) {
        renderer._internal_drawBackground(target, isHovered, hitTestData);
    }
}
export function drawForeground(renderer, target, isHovered, hitTestData) {
    renderer._internal_draw(target, isHovered, hitTestData);
}
export function drawSourcePaneViews(paneViewsGetter, drawRendererFn, source, pane) {
    const paneViews = paneViewsGetter(source, pane);
    for (const paneView of paneViews) {
        const renderer = paneView._internal_renderer();
        if (renderer !== null) {
            drawRendererFn(renderer);
        }
    }
}
