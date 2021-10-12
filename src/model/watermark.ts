import { HorzAlign, VertAlign } from '../renderers/watermark-renderer';
import { IPaneView } from '../views/pane/ipane-view';
import { WatermarkPaneView } from '../views/pane/watermark-pane-view';

import { ChartModel } from './chart-model';
import { DataSource } from './data-source';

/** Watermark options. */
export interface WatermarkOptions {
	/**
	 * Watermark color.
	 *
	 * @default 'rgba(0, 0, 0)'
	 */
	color: string;
	/**
	 * Display the watermark.
	 *
	 * @default false
	 */
	visible: boolean;
	/**
	 * Text of the watermark. Word wrapping is not supported.
	 *
	 * @default ''
	 */
	text: string;
	/**
	 * Font size in pixels.
	 *
	 * @default 48
	 */
	fontSize: number;
	/**
	 * Font family.
	 *
	 * @default "'Trebuchet MS', Roboto, Ubuntu, sans-serif"
	 */
	fontFamily: string;
	/**
	 * Font style.
	 *
	 * @default ''
	 */
	fontStyle: string;
	/**
	 * Horizontal alignment inside the chart area.
	 *
	 * @default 'center'
	 */
	horzAlign: HorzAlign;
	/**
	 * Vertical alignment inside the chart area.
	 *
	 * @default 'center'
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
