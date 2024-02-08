import { ensureNotNull } from '../../helpers/assertions';
import { generateContrastColors } from '../../helpers/color';
import { TimeAxisViewRenderer } from '../../renderers/time-axis-view-renderer';
export class CrosshairTimeAxisView {
    constructor(crosshair, model, valueProvider) {
        this._private__invalidated = true;
        this._private__renderer = new TimeAxisViewRenderer();
        this._private__rendererData = {
            _internal_visible: false,
            _internal_background: '#4c525e',
            _internal_color: 'white',
            _internal_text: '',
            _internal_width: 0,
            _internal_coordinate: NaN,
            _internal_tickVisible: true,
        };
        this._private__crosshair = crosshair;
        this._private__model = model;
        this._private__valueProvider = valueProvider;
    }
    _internal_update() {
        this._private__invalidated = true;
    }
    _internal_renderer() {
        if (this._private__invalidated) {
            this._private__updateImpl();
            this._private__invalidated = false;
        }
        this._private__renderer._internal_setData(this._private__rendererData);
        return this._private__renderer;
    }
    _private__updateImpl() {
        const data = this._private__rendererData;
        data._internal_visible = false;
        if (this._private__crosshair._internal_options().mode === 2 /* CrosshairMode.Hidden */) {
            return;
        }
        const options = this._private__crosshair._internal_options().vertLine;
        if (!options.labelVisible) {
            return;
        }
        const timeScale = this._private__model._internal_timeScale();
        if (timeScale._internal_isEmpty()) {
            return;
        }
        data._internal_width = timeScale._internal_width();
        const value = this._private__valueProvider();
        if (value === null) {
            return;
        }
        data._internal_coordinate = value._internal_coordinate;
        const currentTime = timeScale._internal_indexToTimeScalePoint(this._private__crosshair._internal_appliedIndex());
        data._internal_text = timeScale._internal_formatDateTime(ensureNotNull(currentTime));
        data._internal_visible = true;
        const colors = generateContrastColors(options.labelBackgroundColor);
        data._internal_background = colors._internal_background;
        data._internal_color = colors._internal_foreground;
        data._internal_tickVisible = timeScale._internal_options().ticksVisible;
    }
}
