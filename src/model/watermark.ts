import { HorzAlign, VertAlign } from '../renderers/watermark-renderer';
import { IPaneView } from '../views/pane/ipane-view';
import { WatermarkPaneView } from '../views/pane/watermark-pane-view';

import { ChartModel } from './chart-model';
import { DataSource } from './data-source';

/** Watermark options. */
export interface WatermarkOptions {
	/**
	 * Watermark color.
	 */
	color: string;
	/**
	 * Display the watermark.
	 */
	visible: boolean;
	/**
	 * Text of the watermark. Word wrapping is not supported.
	 */
	text: string;
	/**
	 * Font size in pixels.
	 */
	fontSize: number;
	/**
	 * Font family.
	 */
	fontFamily: string;
	/**
	 * Font style.
	 */
	fontStyle: string;
	/**
	 * Horizontal alignment inside the chart area.
	 */
	horzAlign: HorzAlign;
	/**
	 * Vertical alignment inside the chart area.
	 */
	vertAlign: VertAlign;
}

export class Watermark extends DataSource {
	private readonly _paneView: WatermarkPaneView;
	private readonly _options: WatermarkOptions;

	public constructor(model: ChartModel, options: WatermarkOptions) {
		super();
		this._options = options;
		this._paneView = new WatermarkPaneView(this);
	}

	public paneViews(): readonly IPaneView[] {
		return [this._paneView];
	}

	public options(): Readonly<WatermarkOptions> {
		return this._options;
	}

	public updateAllViews(): void {
		this._paneView.update();
	}
}
