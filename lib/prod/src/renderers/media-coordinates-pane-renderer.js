export class MediaCoordinatesPaneRenderer {
    _internal_draw(target, isHovered, hitTestData) {
        target.useMediaCoordinateSpace((scope) => this._internal__drawImpl(scope, isHovered, hitTestData));
    }
    _internal_drawBackground(target, isHovered, hitTestData) {
        target.useMediaCoordinateSpace((scope) => this._internal__drawBackgroundImpl(scope, isHovered, hitTestData));
    }
    _internal__drawBackgroundImpl(renderingScope, isHovered, hitTestData) { }
}
