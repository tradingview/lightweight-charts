import { PaneRendererLineBase } from './line-renderer-base';
export class PaneRendererLine extends PaneRendererLineBase {
    _strokeStyle(renderingScope, item) {
        return item.lineColor;
    }
}
