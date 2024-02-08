import { ensureNotNull } from '../../helpers/assertions';
import { CrosshairRenderer } from '../../renderers/crosshair-renderer';
export class CrosshairPaneView {
    constructor(source) {
        this._private__invalidated = true;
        this._private__rendererData = {
            _internal_vertLine: {
                _internal_lineWidth: 1,
                _internal_lineStyle: 0,
                _internal_color: '',
                _internal_visible: false,
            },
            _internal_horzLine: {
                _internal_lineWidth: 1,
                _internal_lineStyle: 0,
                _internal_color: '',
                _internal_visible: false,
            },
            _internal_x: 0,
            _internal_y: 0,
        };
        this._private__renderer = new CrosshairRenderer(this._private__rendererData);
        this._private__source = source;
    }
    _internal_update() {
        this._private__invalidated = true;
    }
    _internal_renderer() {
        if (this._private__invalidated) {
            this._private__updateImpl();
            this._private__invalidated = false;
        }
        return this._private__renderer;
    }
    _private__updateImpl() {
        const visible = this._private__source._internal_visible();
        const pane = ensureNotNull(this._private__source._internal_pane());
        const crosshairOptions = pane._internal_model()._internal_options().crosshair;
        const data = this._private__rendererData;
        if (crosshairOptions.mode === 2 /* CrosshairMode.Hidden */) {
            data._internal_horzLine._internal_visible = false;
            data._internal_vertLine._internal_visible = false;
            return;
        }
        data._internal_horzLine._internal_visible = visible && this._private__source._internal_horzLineVisible(pane);
        data._internal_vertLine._internal_visible = visible && this._private__source._internal_vertLineVisible();
        data._internal_horzLine._internal_lineWidth = crosshairOptions.horzLine.width;
        data._internal_horzLine._internal_lineStyle = crosshairOptions.horzLine.style;
        data._internal_horzLine._internal_color = crosshairOptions.horzLine.color;
        data._internal_vertLine._internal_lineWidth = crosshairOptions.vertLine.width;
        data._internal_vertLine._internal_lineStyle = crosshairOptions.vertLine.style;
        data._internal_vertLine._internal_color = crosshairOptions.vertLine.color;
        data._internal_x = this._private__source._internal_appliedX();
        data._internal_y = this._private__source._internal_appliedY();
    }
}
