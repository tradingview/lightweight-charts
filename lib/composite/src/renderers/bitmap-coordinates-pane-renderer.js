"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitmapCoordinatesPaneRenderer = void 0;
class BitmapCoordinatesPaneRenderer {
    draw(target, isHovered, hitTestData) {
        target.useBitmapCoordinateSpace((scope) => this._drawImpl(scope, isHovered, hitTestData));
    }
}
exports.BitmapCoordinatesPaneRenderer = BitmapCoordinatesPaneRenderer;
