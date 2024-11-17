import { makeFont } from '../../helpers/make-font';
import { WatermarkRenderer } from '../../renderers/watermark-renderer';
export class WatermarkPaneView {
    constructor(source) {
        this._invalidated = true;
        this._rendererData = {
            visible: false,
            color: '',
            lines: [],
            vertAlign: 'center',
            horzAlign: 'center',
        };
        this._renderer = new WatermarkRenderer(this._rendererData);
        this._source = source;
    }
    update() {
        this._invalidated = true;
    }
    renderer() {
        if (this._invalidated) {
            this._updateImpl();
            this._invalidated = false;
        }
        return this._renderer;
    }
    _updateImpl() {
        const options = this._source.options();
        const data = this._rendererData;
        data.visible = options.visible;
        if (!data.visible) {
            return;
        }
        data.color = options.color;
        data.horzAlign = options.horzAlign;
        data.vertAlign = options.vertAlign;
        data.lines = [
            {
                text: options.text,
                font: makeFont(options.fontSize, options.fontFamily, options.fontStyle),
                lineHeight: options.fontSize * 1.2,
                vertOffset: 0,
                zoom: 0,
            },
        ];
    }
}
