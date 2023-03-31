import { CustomBox } from '../../model/custom-box';
import { Series } from '../../model/series';
import { UTCTimestamp } from '../../model/time-data';

import { SeriesBoxPaneView } from './series-box-pane-view';

export class CustomBoxPaneView extends SeriesBoxPaneView {
	private readonly _box: CustomBox;

	public constructor(series: Series, box: CustomBox) {
		super(series);
		this._box = box;
	}

	protected _updateImpl(): void {
		const data = this._boxRendererData;
		const boxOptions = this._box.options();

		data.visible = false;

		if (!this._series.visible()) {
			return;
		}

		data.fillColor = boxOptions.fillColor;
		data.fillOpacity = boxOptions.fillOpacity;
		data.borderColor = boxOptions.borderColor;
		data.borderStyle = boxOptions.borderStyle;
		data.borderWidth = boxOptions.borderWidth;
		data.borderVisible = boxOptions.borderVisible;
		data.corners = [];
		data.visible = true;

		if (boxOptions.corners.length === 0) {
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

			data.xLow = xLow;
			data.xHigh = xHigh;
			data.yLow = yLow;
			data.yHigh = yHigh;
		} else {
			for (let i = 0; i < boxOptions.corners.length; ++i) {
				const x = this._box.xCoord(boxOptions.corners[i].time as UTCTimestamp);
				const y = this._box.yCoord(boxOptions.corners[i].price);

				if (x === null || y === null) {
					return;
				}

				data.corners.push({ x: x, y: y });
			}
		}
	}
}
