import { ensureNotNull } from '../../helpers/assertions';

import { CrossHair } from '../../model/cross-hair';
import { CrossHairRenderer, CrossHairRendererData } from '../../renderers/cross-hair-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { IPaneView } from './ipane-view';

export class CrossHairPaneView implements IPaneView {
	private _invalidated: boolean = true;
	private readonly _source: CrossHair;
	private readonly _rendererData: CrossHairRendererData = {
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
		w: 0,
		h: 0,
		x: 0,
		y: 0,
	};
	private _renderer: CrossHairRenderer = new CrossHairRenderer(this._rendererData);

	public constructor(source: CrossHair) {
		this._source = source;
	}

	public update(): void {
		this._invalidated = true;
	}

	public renderer(height: number, width: number): IPaneRenderer {
		if (this._invalidated) {
			this._updateImpl();
		}

		return this._renderer;
	}

	private _updateImpl(): void {
		const visible = this._source.visible();
		const pane = ensureNotNull(this._source.pane());
		const crossHairOptions = pane.model().options().crossHair;

		const data = this._rendererData;

		data.horzLine.visible = visible && this._source.horzLineVisible(pane);
		data.vertLine.visible = visible && this._source.vertLineVisible();

		data.horzLine.lineWidth = crossHairOptions.horzLine.width;
		data.horzLine.lineStyle = crossHairOptions.horzLine.style;
		data.horzLine.color = crossHairOptions.horzLine.color;

		data.vertLine.lineWidth = crossHairOptions.vertLine.width;
		data.vertLine.lineStyle = crossHairOptions.vertLine.style;
		data.vertLine.color = crossHairOptions.vertLine.color;

		data.w = pane.width();
		data.h = pane.height();

		data.x = this._source.appliedX();
		data.y = this._source.appliedY();
	}
}
