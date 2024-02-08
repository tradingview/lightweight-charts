import { PaneRendererLineBase } from './line-renderer-base';
export class PaneRendererLine extends PaneRendererLineBase {
    _internal__strokeStyle(renderingScope, item) {
        return item._internal_lineColor;
    }
}
