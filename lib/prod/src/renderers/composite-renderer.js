export class CompositeRenderer {
    constructor() {
        this._private__renderers = [];
    }
    _internal_setRenderers(renderers) {
        this._private__renderers = renderers;
    }
    _internal_draw(target, isHovered, hitTestData) {
        this._private__renderers.forEach((r) => {
            r._internal_draw(target, isHovered, hitTestData);
        });
    }
}
