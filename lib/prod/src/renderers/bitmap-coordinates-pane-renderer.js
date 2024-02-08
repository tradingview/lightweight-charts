export class BitmapCoordinatesPaneRenderer {
    _internal_draw(target, isHovered, hitTestData) {
        target.useBitmapCoordinateSpace((scope) => this._internal__drawImpl(scope, isHovered, hitTestData));
    }
}
