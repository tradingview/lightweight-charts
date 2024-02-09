"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositeRenderer = void 0;
class CompositeRenderer {
    constructor() {
        this._renderers = [];
    }
    setRenderers(renderers) {
        this._renderers = renderers;
    }
    draw(target, isHovered, hitTestData) {
        this._renderers.forEach((r) => {
            r.draw(target, isHovered, hitTestData);
        });
    }
}
exports.CompositeRenderer = CompositeRenderer;
