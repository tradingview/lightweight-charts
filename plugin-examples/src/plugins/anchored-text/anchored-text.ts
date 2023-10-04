import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	ISeriesPrimitive,
	ISeriesPrimitivePaneRenderer,
	ISeriesPrimitivePaneView,
	SeriesAttachedParameter,
	Time,
} from 'lightweight-charts';

interface AnchoredTextOptions {
	vertAlign: 'top' | 'middle' | 'bottom';
	horzAlign: 'left' | 'middle' | 'right';
	text: string;
	lineHeight: number;
	font: string;
	color: string;
}

class AnchoredTextRenderer implements ISeriesPrimitivePaneRenderer {
	_data: AnchoredTextOptions;

	constructor(options: AnchoredTextOptions) {
		this._data = options;
	}

	draw(target: CanvasRenderingTarget2D) {
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.font = this._data.font;
			const textWidth = ctx.measureText(this._data.text).width;
			const horzMargin = 20;
			let x = horzMargin;
			const width = scope.mediaSize.width;
			const height = scope.mediaSize.height;
			switch (this._data.horzAlign) {
				case 'right': {
					x = width - horzMargin - textWidth;
					break;
				}
				case 'middle': {
					x = width / 2 - textWidth / 2;
					break;
				}
			}
			const vertMargin = 10;
			const lineHeight = this._data.lineHeight;
			let y = vertMargin + lineHeight;
			switch (this._data.vertAlign) {
				case 'middle': {
					y = height / 2 + lineHeight / 2;
					break;
				}
				case 'bottom': {
					y = height - vertMargin;
					break;
				}
			}
			ctx.fillStyle = this._data.color;
			ctx.fillText(this._data.text, x, y);
		});
	}
}

class AnchoredTextPaneView implements ISeriesPrimitivePaneView {
	private _source: AnchoredText;
	constructor(source: AnchoredText) {
		this._source = source;
	}
	update() {}
	renderer() {
		return new AnchoredTextRenderer(this._source._data);
	}
}

export class AnchoredText implements ISeriesPrimitive<Time> {
	_paneViews: AnchoredTextPaneView[];
	_data: AnchoredTextOptions;

	constructor(options: AnchoredTextOptions) {
		this._data = options;
		this._paneViews = [new AnchoredTextPaneView(this)];
	}

	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
	}

	paneViews() {
		return this._paneViews;
	}

	requestUpdate?: () => void;
	attached({ requestUpdate }: SeriesAttachedParameter<Time>) {
		this.requestUpdate = requestUpdate;
	}

	detached() {
		this.requestUpdate = undefined;
	}

	applyOptions(options: Partial<AnchoredTextOptions>) {
		this._data = { ...this._data, ...options };
		if (this.requestUpdate) this.requestUpdate();
	}
}
