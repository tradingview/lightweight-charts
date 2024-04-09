import { Crosshair, CrosshairMode } from '../../model/crosshair';
import { Pane } from '../../model/pane';
import { CrosshairRenderer, CrosshairRendererData } from '../../renderers/crosshair-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { IPaneView } from './ipane-view';

export class CrosshairPaneView implements IPaneView {
	private _validated: WeakMap<Pane, boolean> = new WeakMap();
	private readonly _source: Crosshair;
	private readonly _rendererData: CrosshairRendererData = {
		vertLine: {
			lineWidth: 1,
			lineStyle: 0,
			color: '',
			visible: false,
		},
		horzLine: {
			lineWidth: 1,
			lineStyle: 0,
			color: '',
			visible: false,
		},
		x: 0,
		y: 0,
	};
	private _renderer: CrosshairRenderer = new CrosshairRenderer(this._rendererData);

	public constructor(source: Crosshair) {
		this._source = source;
	}

	public update(pane: Pane | null): void {
		if (pane !== null) {
			this._validated.delete(pane);
		} else {
			this._validated = new WeakMap();
		}
	}

	public renderer(pane: Pane): IPaneRenderer {
		if (!this._validated.get(pane)) {
			this._updateImpl(pane);
			this._validated.set(pane, true);
		}

		return this._renderer;
	}

	private _updateImpl(pane: Pane): void {
		const visible = this._source.visible();
		const crosshairOptions = pane.model().options().crosshair;

		const data = this._rendererData;

		if (crosshairOptions.mode === CrosshairMode.Hidden) {
			data.horzLine.visible = false;
			data.vertLine.visible = false;
			return;
		}

		data.horzLine.visible = visible && this._source.horzLineVisible(pane);
		data.vertLine.visible = visible && this._source.vertLineVisible();

		data.horzLine.lineWidth = crosshairOptions.horzLine.width;
		data.horzLine.lineStyle = crosshairOptions.horzLine.style;
		data.horzLine.color = crosshairOptions.horzLine.color;

		data.vertLine.lineWidth = crosshairOptions.vertLine.width;
		data.vertLine.lineStyle = crosshairOptions.vertLine.style;
		data.vertLine.color = crosshairOptions.vertLine.color;

		data.x = this._source.appliedX();
		data.y = this._source.appliedY();
	}
}
