import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	AutoscaleInfo,
	Coordinate,
	IChartApi,
	ISeriesApi,
	ISeriesPrimitive,
	ISeriesPrimitivePaneRenderer,
	ISeriesPrimitivePaneView,
	Logical,
	SeriesOptionsMap,
	SeriesType,
	Time,
} from 'lightweight-charts';
import { positionsBox } from '../../helpers/dimensions/positions';

interface VolumeProfileItem {
	y: Coordinate | null;
	width: number;
}

interface VolumeProfileRendererData {
	x: Coordinate | null;
	top: Coordinate | null;
	columnHeight: number;
	width: number;
	items: VolumeProfileItem[];
}

interface VolumeProfileDataPoint {
	price: number;
	vol: number;
}

export interface VolumeProfileData {
	time: Time;
	profile: VolumeProfileDataPoint[];
	width: number;
}

class VolumeProfileRenderer implements ISeriesPrimitivePaneRenderer {
	_data: VolumeProfileRendererData;
	constructor(data: VolumeProfileRendererData) {
		this._data = data;
	}

	draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace(scope => {
			if (this._data.x === null || this._data.top === null) return;
			const ctx = scope.context;
			const horizontalPositions = positionsBox(
				this._data.x,
				this._data.x + this._data.width,
				scope.horizontalPixelRatio
			);
			const verticalPositions = positionsBox(
				this._data.top,
				this._data.top - this._data.columnHeight * this._data.items.length,
				scope.verticalPixelRatio
			);

			ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
			ctx.fillRect(
				horizontalPositions.position,
				verticalPositions.position,
				horizontalPositions.length,
				verticalPositions.length
			);

			ctx.fillStyle = 'rgba(80, 80, 255, 0.8)';
			this._data.items.forEach(row => {
				if (row.y === null) return;
				const itemVerticalPos = positionsBox(
					row.y,
					row.y - this._data.columnHeight,
					scope.verticalPixelRatio
				);
				const itemHorizontalPos = positionsBox(
					this._data.x!,
					this._data.x! + row.width,
					scope.horizontalPixelRatio
				);
				ctx.fillRect(
					itemHorizontalPos.position,
					itemVerticalPos.position,
					itemHorizontalPos.length,
					itemVerticalPos.length - 2 // 1 to close gaps
				);
			});
		});
	}
}

class VolumeProfilePaneView implements ISeriesPrimitivePaneView {
	_source: VolumeProfile;
	_x: Coordinate | null = null;
	_width: number = 6;
	_columnHeight: number = 0;
	_top: Coordinate | null = null;
	_items: VolumeProfileItem[] = [];
	constructor(source: VolumeProfile) {
		this._source = source;
	}

	update() {
		const data = this._source._vpData;
		const series = this._source._series;
		const timeScale = this._source._chart.timeScale();
		this._x = timeScale.timeToCoordinate(data.time);
		this._width = timeScale.options().barSpacing * data.width;

		const y1 =
			series.priceToCoordinate(data.profile[0].price) ?? (0 as Coordinate);
		const y2 =
			series.priceToCoordinate(data.profile[1].price) ??
			(timeScale.height() as Coordinate);
		this._columnHeight = Math.max(1, y1 - y2);
		const maxVolume = data.profile.reduce(
			(acc, item) => Math.max(acc, item.vol),
			0
		);

		this._top = y1;

		this._items = data.profile.map(row => ({
			y: series.priceToCoordinate(row.price),
			width: (this._width * row.vol) / maxVolume,
		}));
	}

	renderer() {
		return new VolumeProfileRenderer({
			x: this._x,
			top: this._top,
			columnHeight: this._columnHeight,
			width: this._width,
			items: this._items,
		});
	}
}

export class VolumeProfile implements ISeriesPrimitive<Time> {
	_chart: IChartApi;
	_series: ISeriesApi<keyof SeriesOptionsMap>;
	_vpData: VolumeProfileData;
	_minPrice: number;
	_maxPrice: number;
	_paneViews: VolumeProfilePaneView[];

	_vpIndex: number | null = null;

	constructor(
		chart: IChartApi,
		series: ISeriesApi<SeriesType>,
		vpData: VolumeProfileData
	) {
		this._chart = chart;
		this._series = series;
		this._vpData = vpData;
		this._minPrice = Infinity;
		this._maxPrice = -Infinity;
		this._vpData.profile.forEach(vpData => {
			if (vpData.price < this._minPrice) this._minPrice = vpData.price;
			if (vpData.price > this._maxPrice) this._maxPrice = vpData.price;
		});
		this._paneViews = [new VolumeProfilePaneView(this)];
	}
	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
	}

	// Ensures that the VP is within autoScale
	autoscaleInfo(
		startTimePoint: Logical,
		endTimePoint: Logical
	): AutoscaleInfo | null {
		// calculation of vpIndex could be remembered to reduce CPU usage
		// and only recheck if the data is changed ('full' update).
		const vpCoordinate = this._chart
			.timeScale()
			.timeToCoordinate(this._vpData.time);
		if (vpCoordinate === null) return null;
		const vpIndex = this._chart.timeScale().coordinateToLogical(vpCoordinate);
		if (vpIndex === null) return null;
		if (endTimePoint < vpIndex || startTimePoint > vpIndex + this._vpData.width)
			return null;
		return {
			priceRange: {
				minValue: this._minPrice,
				maxValue: this._maxPrice,
			},
		};
	}

	paneViews() {
		return this._paneViews;
	}
}
