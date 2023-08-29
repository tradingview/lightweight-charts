import {
	CrosshairMode,
	ISeriesPrimitive,
	SeriesAttachedParameter,
	LineData,
	WhitespaceData,
	CandlestickData,
	ColorType,
	LineStyleOptions,
	AreaStyleOptions,
	ISeriesPrimitivePaneView,
	Time,
} from 'lightweight-charts';
import { Delegate, ISubscription } from '../../helpers/delegate';
import { convertTime, formattedDateAndTime } from '../../helpers/time';
import {
	MultiTouchCrosshairPaneView,
	TooltipCrosshairLineData,
} from './crosshair-line-pane';
import { DeltaSingleTooltipData, DeltaTooltipData, DeltaTooltipPaneView } from './delta-tooltip-pane';
import {
	MultiTouchChartEvents,
	MultiTouchInteraction,
} from './multi-touch-chart-events';

const defaultOptions: TooltipPrimitiveOptions = {
	lineColor: 'rgba(0, 0, 0, 0.2)',
	priceExtractor: (data: LineData | CandlestickData | WhitespaceData) => {
		if ((data as LineData).value !== undefined) {
			return [(data as LineData).value, (data as LineData).value.toFixed(2)];
		}
		if ((data as CandlestickData).close !== undefined) {
			return [
				(data as CandlestickData).close,
				(data as CandlestickData).close.toFixed(2),
			];
		}
		return [0, ''];
	},
	showTime: false,
	topOffset: 20,
};

export interface TooltipPrimitiveOptions {
	lineColor: string;
	priceExtractor: <T extends WhitespaceData>(dataPoint: T) => [number, string];
	showTime: boolean;
	topOffset: number;
}

export interface ActiveRange {
	from: number;
	to: number;
	positive: boolean;
}

export class DeltaTooltipPrimitive implements ISeriesPrimitive<Time> {
	private _options: TooltipPrimitiveOptions;
	_crosshairPaneView: MultiTouchCrosshairPaneView;
	_deltaTooltipPaneView: DeltaTooltipPaneView;
	_paneViews: ISeriesPrimitivePaneView[];
	_crosshairData: TooltipCrosshairLineData[] = [];
	_tooltipData: Partial<DeltaTooltipData>;
	_attachedParams: SeriesAttachedParameter<Time> | undefined;
	_touchChartEvents: MultiTouchChartEvents | null = null;

	private _activeRange: Delegate<ActiveRange | null> = new Delegate();

	constructor(options: Partial<TooltipPrimitiveOptions>) {
		this._options = {
			...defaultOptions,
			...options,
		};
		this._tooltipData = {
			topSpacing: this._options.topOffset,
		};
		this._crosshairPaneView = new MultiTouchCrosshairPaneView(this._crosshairData);
		this._deltaTooltipPaneView = new DeltaTooltipPaneView(this._tooltipData);
		this._paneViews = [this._crosshairPaneView, this._deltaTooltipPaneView];
	}

	attached(param: SeriesAttachedParameter<Time>): void {
		this._attachedParams = param;
		this._setCrosshairMode();
		this._touchChartEvents = new MultiTouchChartEvents(param.chart, {
			simulateMultiTouchUsingMouseDrag: true,
		});
		this._touchChartEvents.leave().subscribe(() => {
			this._activeRange.fire(null);
			this._hideCrosshair();
		}, this);
		this._touchChartEvents
			.move()
			.subscribe((interactions: MultiTouchInteraction) => {
				this._showTooltip(interactions);
			}, this);
	}

	detached(): void {
		if (this._touchChartEvents) {
			this._touchChartEvents.leave().unsubscribeAll(this);
			this._touchChartEvents.move().unsubscribeAll(this);
			this._touchChartEvents.destroy();
		}
		this._activeRange.destroy();
	}

	paneViews() {
		return this._paneViews;
	}

	updateAllViews() {
		this._crosshairPaneView.update(this._crosshairData);
		this._deltaTooltipPaneView.update(this._tooltipData);
	}

	setData(crosshairData: TooltipCrosshairLineData[], tooltipData: Partial<DeltaTooltipData>) {
		this._crosshairData = crosshairData;
		this._tooltipData = tooltipData;
		this.updateAllViews();
		this._attachedParams?.requestUpdate();
	}

	currentColor() {
		return this._options.lineColor;
	}

	chart() {
		return this._attachedParams?.chart;
	}

	series() {
		return this._attachedParams?.series;
	}

	applyOptions(options: Partial<TooltipPrimitiveOptions>) {
		this._options = {
			...this._options,
			...options,
		};
		this._tooltipData.topSpacing = this._options.topOffset;
	}

	public activeRange(): ISubscription<ActiveRange | null> {
		return this._activeRange;
	}

	private _setCrosshairMode() {
		const chart = this.chart();
		if (!chart) {
			throw new Error(
				'Unable to change crosshair mode because the chart instance is undefined'
			);
		}
		chart.applyOptions({
			crosshair: {
				mode: CrosshairMode.Magnet,
				vertLine: {
					visible: false,
					labelVisible: false,
				},
				horzLine: {
					visible: false,
					labelVisible: false,
				},
			},
		});
		const series = this.series();
		if (series) {
			// We need to draw the crosshair markers ourselves since there can be multiple points now.
			series.applyOptions({ crosshairMarkerVisible: false });
		}
	}

	private _hideTooltip() {
		this.setData([], {
			tooltips: [],
		});
	}

	private _hideCrosshair() {
		this._hideTooltip();
	}

	private _chartBackgroundColor(): string {
		const chart = this.chart();
		if (!chart) {
			return '#FFFFFF';
		}
		const backgroundOptions = chart.options().layout.background;
		if (backgroundOptions.type === ColorType.Solid) {
			return backgroundOptions.color;
		}
		return backgroundOptions.topColor;
	}

	private _seriesLineColor(): string {
		const series = this.series();
		if (!series) {
			return '#888';
		}
		const seriesOptions = series.options();
		return (
			(seriesOptions as LineStyleOptions).color ||
			(seriesOptions as AreaStyleOptions).lineColor ||
			'#888'
		);
	}

	private _showTooltip(interactions: MultiTouchInteraction) {
		const series = this.series();
		if (interactions.points.length < 1 || !series) {
			this._hideCrosshair();
			return;
		}
		const topMargin = this._tooltipData.topSpacing ?? 20;
		const markerBorderColor = this._chartBackgroundColor();
		const markerColor = this._seriesLineColor();
		const tooltips: DeltaSingleTooltipData[] = [];
		const crosshairData: TooltipCrosshairLineData[] = [];
		const priceValues: [number, number][] = [];
		let firstPointIndex = interactions.points[0].index;
		for (let i = 0; i < Math.min(2, interactions.points.length); i++) {
			const point = interactions.points[i];
			const data = series.dataByIndex(point.index);
			if (data) {
				const [priceValue, priceString] = this._options.priceExtractor(data);
				priceValues.push([priceValue, point.index]);
				const priceY = series.priceToCoordinate(priceValue) ?? -1000;
				const [date, time] = formattedDateAndTime(
					data.time ? convertTime(data.time) : undefined
				);
				const state: DeltaSingleTooltipData = {
					x: point.x,
					lineContent: [priceString, date],
				};
				if (this._options.showTime) {
					state.lineContent.push(time);
				}
				if (point.index >= firstPointIndex) {
					tooltips.push(state);
				} else {
					tooltips.unshift(state); // place at front so order is correct.
				}

				crosshairData.push({
					x: point.x,
					priceY,
					visible: true,
					color: this.currentColor(),
					topMargin,
					markerColor,
					markerBorderColor,
				});
			}
		}
		const deltaContent: Partial<DeltaTooltipData> = {
			tooltips,
		};
		if (priceValues.length > 1) {
			const correctOrder = priceValues[1][1] > priceValues[0][1];
			const firstPrice = correctOrder ? priceValues[0][0] : priceValues[1][0];
			const secondPrice = correctOrder ? priceValues[1][0] : priceValues[0][0];
			const priceChange = secondPrice - firstPrice;
			const pctChange = (100 * priceChange) / firstPrice;
			const positive = priceChange >= 0;
			deltaContent.deltaTopLine = (positive ? '+' : '') + priceChange.toFixed(2);
			deltaContent.deltaBottomLine = (positive ? '+' : '') + pctChange.toFixed(2) + '%';
			deltaContent.deltaBackgroundColor = positive ? 'rgb(4,153,129, 0.2)' : 'rgb(239,83,80, 0.2)';
			deltaContent.deltaTextColor = positive ? 'rgb(4,153,129)' : 'rgb(239,83,80)';
			this._activeRange.fire({
				from: priceValues[correctOrder ? 0 : 1][1] + 1,
				to: priceValues[correctOrder ? 1 : 0][1] + 1,
				positive,
			});
		} else {
			deltaContent.deltaTopLine = '';
			deltaContent.deltaBottomLine = '';
			this._activeRange.fire(null);
		}
		this.setData(crosshairData, deltaContent);

	}
}
