import { HorzAlign, VertAlign } from '../renderers/watermark-renderer';
import { IPaneView } from '../views/pane/ipane-view';
import { WatermarkPaneView } from '../views/pane/watermark-pane-view';

import { ChartModel } from './chart-model';
import { DataSource } from './data-source';

export interface WatermarkOptions {
	color: string;
	visible: boolean;
	text: string;
	fontSize: number;
	horzAlign: HorzAlign;
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

	public paneViews(): ReadonlyArray<IPaneView> {
		return [this._paneView];
	}

	public options(): WatermarkOptions {
		return this._options;
	}

	public updateAllViews(): void {
		this._paneView.update();
	}
}
