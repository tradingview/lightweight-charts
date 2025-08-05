import {
	DataChangedScope,
	DeepPartial,
	IChartApi,
	IPrimitivePaneView,
	ISeriesApi,
	ISeriesPrimitive,
	LogicalRange,
	SeriesAttachedParameter,
	SeriesType,
	Time,
	TimePointIndex,
} from "lightweight-charts";
import { isOhlcData, isValueData, merge } from "./helper";
import { PaneView } from "./pane-view";
import { IMinMaxPriceMarkersOptions } from "./types";

export class MinMaxPriceMarkers implements ISeriesPrimitive<Time> {
	private _paneView: PaneView | null = null;

	private _chart: IChartApi | null = null;
	private _series: ISeriesApi<SeriesType> | null = null;
	private _requestUpdate?: () => void;
	private _recalculationRequired: boolean = true;

	private _markers: {
		time: TimePointIndex;
		price: number;
		variant: "left" | "right";
	}[] = [];

	private _options: IMinMaxPriceMarkersOptions = {
		textColor: "#000",
		zOrder: "aboveSeries",
	};

	// --------------------------------------------------
	public constructor() {}

	// --------------------------------------------------
	public applyOptions(options: DeepPartial<IMinMaxPriceMarkersOptions>): void {
		this._options = merge(this._options, options);
	}

	// --------------------------------------------------
	public attached(param: SeriesAttachedParameter<Time>): void {
		this._recalculateMarkers();
		this._chart = param.chart;
		this._series = param.series;
		this._paneView = new PaneView({
			series: this._series,
			chart: this._chart,
			options: this._options,
		});
		this._requestUpdate = param.requestUpdate;
		this._recalculationRequired = true;
		this.requestUpdate();

		this._series.subscribeDataChanged(this._dataChangedHandler);
		this._chart
			.timeScale()
			.subscribeVisibleLogicalRangeChange(this._visibleRangeChanged);
	}

	// --------------------------------------------------
	public requestUpdate(): void {
		if (!this._requestUpdate) {
			return;
		}
		this._requestUpdate();
	}

	// --------------------------------------------------
	public detached(): void {
		this._series?.unsubscribeDataChanged(this._dataChangedHandler);
		this._chart
			?.timeScale()
			.unsubscribeVisibleLogicalRangeChange(this._visibleRangeChanged);
		this._requestUpdate = undefined;

		this._markers = [];

		this._paneView = null;
		this._series = null;
		this._chart = null;
	}

	// --------------------------------------------------
	public paneViews(): readonly IPrimitivePaneView[] {
		return this._paneView ? [this._paneView] : [];
	}

	// --------------------------------------------------
	public updateAllViews(): void {
		if (!this._paneView) {
			return;
		}

		this._recalculateMarkers();
		this._paneView.setMarkers({ markers: this._markers });
		this._paneView.updateOptions(this._options);
		this._paneView.update();
	}

	// --------------------------------------------------
	private _dataChangedHandler = (scope: DataChangedScope) =>
		this._onDataChanged(scope);

	// --------------------------------------------------
	private _onDataChanged(_scope: DataChangedScope) {
		if (!this._chart || !this._series) {
			return;
		}

		this._recalculationRequired = true;
		this.requestUpdate();
	}

	// --------------------------------------------------
	private _visibleRangeChanged = (logicalRange: LogicalRange | null) =>
		this._onVisibleRangeChanged(logicalRange);

	// --------------------------------------------------
	private _onVisibleRangeChanged(logicalRange: LogicalRange | null) {
		if (!this._chart || !this._series || !logicalRange) {
			return;
		}

		this._recalculationRequired = true;
		this.requestUpdate();
	}

	// --------------------------------------------------
	private _recalculateMarkers(): void {
		if (!this._recalculationRequired || !this._chart || !this._series) {
			return;
		}

		this._markers = [];
		const timeScale = this._chart.timeScale();
		const seriesData = this._series.data();
		const visibleBars = timeScale.getVisibleLogicalRange();
		if (!visibleBars || !seriesData.length) {
			return;
		}

		const bars = this._series.barsInLogicalRange(visibleBars);
		if (!bars) {
			return;
		}

		const from = bars.from;
		const to = bars.to;
		if (!from || !to) {
			return;
		}

		const seriesDataLength = seriesData.length;
		let max = -Infinity;
		let maxTime: Time | null = null;
		let min = Infinity;
		let minTime: Time | null = null;

		for (let i = 0; i < seriesDataLength; i++) {
			const dataPoint = seriesData[i];
			const time = dataPoint.time;
			if (time < from || time > to) {
				continue; // Skip data points outside the visible range
			}

			if (isOhlcData(dataPoint)) {
				if (dataPoint.high > max) {
					max = dataPoint.high;
					maxTime = time;
				}

				if (dataPoint.low < min) {
					min = dataPoint.low;
					minTime = time;
				}
			} else if (isValueData(dataPoint)) {
				if (dataPoint.value > max) {
					max = dataPoint.value;
					maxTime = time;
				}

				if (dataPoint.value < min) {
					min = dataPoint.value;
					minTime = time;
				}
			}
		}

		if (!maxTime || !minTime) {
			return;
		}

		const isMinLarger = minTime > maxTime;

		this._markers.push({
			time: timeScale.timeToIndex(maxTime, true) as TimePointIndex,
			price: max,
			variant: isMinLarger ? "right" : "left",
		});

		this._markers.push({
			time: timeScale.timeToIndex(minTime, true) as TimePointIndex,
			price: min,
			variant: isMinLarger ? "left" : "right",
		});

		this._recalculationRequired = false;
	}
}
