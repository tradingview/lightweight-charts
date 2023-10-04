import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	AutoscaleInfo,
	BarData,
	Coordinate,
	DataChangedScope,
	ISeriesPrimitive,
	ISeriesPrimitivePaneRenderer,
	ISeriesPrimitivePaneView,
	LineData,
	Logical,
	SeriesAttachedParameter,
	SeriesDataItemTypeMap,
	SeriesType,
	Time,
} from 'lightweight-charts';
import { PluginBase } from '../plugin-base';
import { cloneReadonly } from '../../helpers/simple-clone';
import { ClosestTimeIndexFinder } from '../../helpers/closest-index';
import { UpperLowerInRange } from '../../helpers/min-max-in-range';

interface BandRendererData {
	x: Coordinate | number;
	upper: Coordinate | number;
	lower: Coordinate | number;
}

class BandsIndicatorPaneRenderer implements ISeriesPrimitivePaneRenderer {
	_viewData: BandViewData;
	constructor(data: BandViewData) {
		this._viewData = data;
	}
	draw() {}
	drawBackground(target: CanvasRenderingTarget2D) {
		const points: BandRendererData[] = this._viewData.data;
		target.useBitmapCoordinateSpace(scope => {
			const ctx = scope.context;
			ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);

			ctx.strokeStyle = this._viewData.options.lineColor;
			ctx.lineWidth = this._viewData.options.lineWidth;
			ctx.beginPath();
			const region = new Path2D();
			const lines = new Path2D();
			region.moveTo(points[0].x, points[0].upper);
			lines.moveTo(points[0].x, points[0].upper);
			for (const point of points) {
				region.lineTo(point.x, point.upper);
				lines.lineTo(point.x, point.upper);
			}
			const end = points.length - 1;
			region.lineTo(points[end].x, points[end].lower);
			lines.moveTo(points[end].x, points[end].lower);
			for (let i = points.length - 2; i >= 0; i--) {
				region.lineTo(points[i].x, points[i].lower);
				lines.lineTo(points[i].x, points[i].lower);
			}
			region.lineTo(points[0].x, points[0].upper);
			region.closePath();
			ctx.stroke(lines);
			ctx.fillStyle = this._viewData.options.fillColor;
			ctx.fill(region);
		});
	}
}

interface BandViewData {
	data: BandRendererData[];
	options: Required<BandsIndicatorOptions>;
}

class BandsIndicatorPaneView implements ISeriesPrimitivePaneView {
	_source: BandsIndicator;
	_data: BandViewData;

	constructor(source: BandsIndicator) {
		this._source = source;
		this._data = {
			data: [],
			options: this._source._options,
		};
	}

	update() {
		const series = this._source.series;
		const timeScale = this._source.chart.timeScale();
		this._data.data = this._source._bandsData.map(d => {
			return {
				x: timeScale.timeToCoordinate(d.time) ?? -100,
				upper: series.priceToCoordinate(d.upper) ?? -100,
				lower: series.priceToCoordinate(d.lower) ?? -100,
			};
		});
	}

	renderer() {
		return new BandsIndicatorPaneRenderer(this._data);
	}
}

interface BandData {
	time: Time;
	upper: number;
	lower: number;
}

function extractPrice(
	dataPoint: SeriesDataItemTypeMap[SeriesType]
): number | undefined {
	if ((dataPoint as BarData).close) return (dataPoint as BarData).close;
	if ((dataPoint as LineData).value) return (dataPoint as LineData).value;
	return undefined;
}

export interface BandsIndicatorOptions {
	lineColor?: string;
	fillColor?: string;
	lineWidth?: number;
}

const defaults: Required<BandsIndicatorOptions> = {
	lineColor: 'rgb(25, 200, 100)',
	fillColor: 'rgba(25, 200, 100, 0.25)',
	lineWidth: 1,
};

export class BandsIndicator extends PluginBase implements ISeriesPrimitive<Time> {
	_paneViews: BandsIndicatorPaneView[];
	_seriesData: SeriesDataItemTypeMap[SeriesType][] = [];
	_bandsData: BandData[] = [];
	_options: Required<BandsIndicatorOptions>;
	_timeIndices: ClosestTimeIndexFinder<{ time: number }>;
	_upperLower: UpperLowerInRange<BandData>;

	constructor(options: BandsIndicatorOptions = {}) {
		super();
		this._options = { ...defaults, ...options };
		this._paneViews = [new BandsIndicatorPaneView(this)];
		this._timeIndices = new ClosestTimeIndexFinder([]);
		this._upperLower = new UpperLowerInRange([]);
	}

	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
	}

	paneViews() {
		return this._paneViews;
	}

	attached(p: SeriesAttachedParameter<Time>): void {
		super.attached(p);
		this.dataUpdated('full');
	}

	dataUpdated(scope: DataChangedScope) {
		// plugin base has fired a data changed event
		this._seriesData = cloneReadonly(this.series.data());
		this.calculateBands();
		if (scope === 'full') {
			this._timeIndices = new ClosestTimeIndexFinder(
				this._seriesData as { time: number }[]
			);
		}
	}

	_minValue: number = Number.POSITIVE_INFINITY;
	_maxValue: number = Number.NEGATIVE_INFINITY;
	calculateBands() {
		const bandData: BandData[] = new Array(this._seriesData.length);
		let index = 0;
		this._minValue = Number.POSITIVE_INFINITY;
		this._maxValue = Number.NEGATIVE_INFINITY;
		this._seriesData.forEach(d => {
			const price = extractPrice(d);
			if (price === undefined) return;
			const upper = price * 1.1;
			const lower = price * 0.9;
			if (upper > this._maxValue) this._maxValue = upper;
			if (lower < this._minValue) this._minValue = lower;
			bandData[index] = {
				upper,
				lower,
				time: d.time,
			};
			index += 1;
		});
		bandData.length = index;
		this._bandsData = bandData;
		this._upperLower = new UpperLowerInRange(this._bandsData, 4);
	}

	autoscaleInfo(startTimePoint: Logical, endTimePoint: Logical): AutoscaleInfo {
		const ts = this.chart.timeScale();
		const startTime = (ts.coordinateToTime(
			ts.logicalToCoordinate(startTimePoint) ?? 0
		) ?? 0) as number;
		const endTime = (ts.coordinateToTime(
			ts.logicalToCoordinate(endTimePoint) ?? 5000000000
		) ?? 5000000000) as number;
		const startIndex = this._timeIndices.findClosestIndex(startTime, 'left');
		const endIndex = this._timeIndices.findClosestIndex(endTime, 'right');
		const range = this._upperLower.getMinMax(startIndex, endIndex);
		return {
			priceRange: {
				minValue: range.lower,
				maxValue: range.upper,
			},
		};
	}
}
