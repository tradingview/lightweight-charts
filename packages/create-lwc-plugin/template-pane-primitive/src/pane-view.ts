import { IPanePrimitivePaneView, PrimitivePaneViewZOrder } from 'lightweight-charts';
import { _CLASSNAME_PaneRenderer } from './pane-renderer';
import { _CLASSNAME_Options } from './options';

export class _CLASSNAME_PaneView implements IPanePrimitivePaneView {
	_options: _CLASSNAME_Options;

	constructor(options: _CLASSNAME_Options) {
		this._options = options;
	}

	update(options: _CLASSNAME_Options) {
		//* Called whenever the primitive's data or options change. Recalculate
		//* anything the renderer needs here rather than inside draw().
		this._options = options;
	}

	zOrder(): PrimitivePaneViewZOrder {
		//* 'top' draws above the series and the crosshair, 'bottom' draws behind
		//* the series, and 'normal' draws at the same level as the series.
		return 'top';
	}

	renderer() {
		return new _CLASSNAME_PaneRenderer(this._options);
	}
}
