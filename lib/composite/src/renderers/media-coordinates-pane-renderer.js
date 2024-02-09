"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaCoordinatesPaneRenderer = void 0;
class MediaCoordinatesPaneRenderer {
    draw(target, isHovered, hitTestData) {
        target.useMediaCoordinateSpace((scope) => this._drawImpl(scope, isHovered, hitTestData));
    }
    drawBackground(target, isHovered, hitTestData) {
        target.useMediaCoordinateSpace((scope) => this._drawBackgroundImpl(scope, isHovered, hitTestData));
    }
    _drawBackgroundImpl(renderingScope, isHovered, hitTestData) { }
}
exports.MediaCoordinatesPaneRenderer = MediaCoordinatesPaneRenderer;
