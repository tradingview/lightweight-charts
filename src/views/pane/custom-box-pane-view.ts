import { CustomBox } from '../../model/custom-box';
import { Series } from '../../model/series';

import { SeriesBoxPaneView } from './series-box-pane-view';

export class CustomBoxPaneView extends SeriesBoxPaneView {
	private readonly _box: CustomBox;

	public constructor(series: Series, box: CustomBox) {
		super(series);
		this._box = box;
	}

	protected _updateImpl(height: number, width: number): void {
		const data = this._boxRendererData;
		data.visible = false;

		const boxOptions = this._box.options();

		if (!this._series.visible()) {
			return;
		}

		const yLow = this._box.yLowCoord();
		const yHigh = this._box.yHighCoord();

		if (yLow === null || yHigh === null) {
			return;
		}

		const xLow = this._box.xLowCoord();
		const xHigh = this._box.xHighCoord();

		if (xLow === null || xHigh === null) {
			return;
		}

		data.fillColor = boxOptions.fillColor;
		data.fillOpacity = boxOptions.fillOpacity;
		data.borderColor = boxOptions.borderColor;
		data.borderStyle = boxOptions.borderStyle;
		data.borderWidth = boxOptions.borderWidth;
		data.borderVisible = boxOptions.borderVisible;
		data.xLow = xLow;
		data.xHigh = xHigh;
		data.yLow = yLow;
		data.yHigh = yHigh;
		data.visible = true;

		data.width = width;
		data.height = height;
	}
}
