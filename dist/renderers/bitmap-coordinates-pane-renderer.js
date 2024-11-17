export class BitmapCoordinatesPaneRenderer {
    draw(target, isHovered, hitTestData) {
        target.useBitmapCoordinateSpace((scope) => this._drawImpl(scope, isHovered, hitTestData));
    }
}
