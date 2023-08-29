import {
	DataChangedScope,
	IChartApi,
	ISeriesApi,
	LineData,
	MismatchDirection,
	SeriesOptionsMap,
	UTCTimestamp,
	WhitespaceData,
} from 'lightweight-charts';
import {
	ExpiringPriceAlert,
	IExpiringPriceAlerts,
} from './iexpiring-price-alerts';
import {
	ExpiringPriceAlertParameters,
	ExpiringPriceAlertsOptions,
	defaultOptions,
} from './options';
import { ExpiringAlertPrimitive } from './primitive';

/**
 * This Plugin will work best with a chart which has a linear time scale.
 */

function hasValue(data: LineData | WhitespaceData): data is LineData {
	return (data as LineData).value !== undefined;
}

export class ExpiringPriceAlerts implements IExpiringPriceAlerts {
	_options: ExpiringPriceAlertsOptions;
	_chart: IChartApi | null = null;
	_series: ISeriesApi<keyof SeriesOptionsMap>;
	_primitive: ExpiringAlertPrimitive;

	_whitespaceSeriesStart: number | null = null;
	_whitespaceSeriesEnd: number | null = null;
	_whitespaceSeries: ISeriesApi<'Line'>;

	_alerts: Map<string, ExpiringPriceAlert> = new Map();
	_dataChangedHandler: (scope: DataChangedScope) => void;

	constructor(
		series: ISeriesApi<keyof SeriesOptionsMap>,
		options: Partial<ExpiringPriceAlertsOptions>
	) {
		this._series = series;
		this._options = {
			...defaultOptions,
			...options,
		};
		this._primitive = new ExpiringAlertPrimitive(this);
		this._series.attachPrimitive(this._primitive);
		this._dataChangedHandler = this._dataChanged.bind(this);
		this._series.subscribeDataChanged(this._dataChangedHandler);

		const currentLastPoint = this._series.dataByIndex(
			10000,
			MismatchDirection.NearestLeft
		);
		if (currentLastPoint) this.checkedCrossed(currentLastPoint);

		this._chart = this._primitive.chart;
		this._whitespaceSeries = this._chart.addLineSeries();
	}

	destroy() {
		this._series.unsubscribeDataChanged(this._dataChangedHandler);
		this._series.detachPrimitive(this._primitive);
	}

	alerts() {
		return this._alerts;
	}
	chart() {
		return this._chart;
	}
	series() {
		return this._series;
	}

	addExpiringAlert(
		price: number,
		startDate: number,
		endDate: number,
		parameters: ExpiringPriceAlertParameters
	): string {
		let id = (Math.random() * 100000).toFixed();
		while (this._alerts.has(id)) {
			id = (Math.random() * 100000).toFixed();
		}
		this._alerts.set(id, {
			price,
			start: startDate,
			end: endDate,
			parameters,
			crossed: false,
			expired: false,
		});
		this._update();
		return id;
	}

	removeExpiringAlert(id: string) {
		this._alerts.delete(id);
		this._update();
	}

	toggleCrossed(id: string) {
		const alert = this._alerts.get(id);
		if (!alert) return;
		alert.crossed = true;
		setTimeout(() => {
			this.removeExpiringAlert(id);
		}, this._options.clearTimeout);
		this._update();
	}

	checkExpired(time: number) {
		for (const [id, data] of this._alerts.entries()) {
			if (data.end <= time) {
				data.expired = true;
				setTimeout(() => {
					this.removeExpiringAlert(id);
				}, this._options.clearTimeout);
			}
		}
		this._update();
	}

	_lastValue: number | undefined = undefined;
	checkedCrossed(point: LineData | WhitespaceData) {
		if (!hasValue(point)) return;
		if (this._lastValue !== undefined) {
			for (const [id, data] of this._alerts.entries()) {
				let crossed = false;
				if (data.parameters.crossingDirection === 'up') {
					if (this._lastValue <= data.price && point.value > data.price) {
						crossed = true;
					}
				} else if (data.parameters.crossingDirection === 'down') {
					if (this._lastValue >= data.price && point.value < data.price) {
						crossed = true;
					}
				}
				if (crossed) {
					this.toggleCrossed(id);
				}
			}
		}
		this._lastValue = point.value;
	}

	_update() {
		let start: number | null = Infinity;
		let end: number | null = 0;
		const hasAlerts = this._alerts.size > 0;
		for (const [_id, data] of this._alerts.entries()) {
			if (data.end > end) end = data.end;
			if (data.start < start) start = data.start;
		}
		if (!hasAlerts) {
			start = null;
			end = null;
		}
		if (start) {
			const lastPlotDate =
				(this._series.dataByIndex(1000000, MismatchDirection.NearestLeft)
					?.time as number | undefined) ?? start;
			if (lastPlotDate < start) start = lastPlotDate;
		}
		if (
			this._whitespaceSeriesStart !== start ||
			this._whitespaceSeriesEnd !== end
		) {
			this._whitespaceSeriesStart = start;
			this._whitespaceSeriesEnd = end;
			if (!this._whitespaceSeriesStart || !this._whitespaceSeriesEnd) {
				this._whitespaceSeries.setData([]);
			} else {
				this._whitespaceSeries.setData(
					this._buildWhitespace(
						this._whitespaceSeriesStart,
						this._whitespaceSeriesEnd
					)
				);
			}
		}

		this._primitive.requestUpdate();
	}

	_buildWhitespace(start: number, end: number): WhitespaceData[] {
		const data: WhitespaceData[] = [];
		for (let time = start; time <= end; time += this._options.interval) {
			data.push({ time: time as UTCTimestamp });
		}
		return data;
	}

	_dataChanged() {
		const lastPoint = this._series.dataByIndex(
			100000,
			MismatchDirection.NearestLeft
		);
		if (!lastPoint) return;
		this.checkedCrossed(lastPoint);
		this.checkExpired(lastPoint.time as number);
	}
}
