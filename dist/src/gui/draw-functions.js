export function drawBackground(renderer, target, isHovered, hitTestData) {
    if (renderer.drawBackground) {
        renderer.drawBackground(target, isHovered, hitTestData);
    }
}
export function drawForeground(renderer, target, isHovered, hitTestData) {
    renderer.draw(target, isHovered, hitTestData);
}
export function drawSourcePaneViews(paneViewsGetter, drawRendererFn, source, pane) {
    const paneViews = paneViewsGetter(source, pane);
    for (const paneView of paneViews) {
        const renderer = paneView.renderer();
        if (renderer !== null) {
            drawRendererFn(renderer);
        }
    }
}
