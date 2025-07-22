import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas';

import { CustomBarItemData, ICustomSeriesPaneRenderer, PaneRendererCustomData, PriceToCoordinateConverter, SeriesDataItemTypeMap, SingleValueData } from 'lightweight-charts';

import { PrettyHistogramSeriesOptions } from './options';
import { PrettyHistogramData } from './data';

interface PrettyHistogramBarItem {
	x: number;
	value: number;
	color: string;
}

export class PrettyHistogramSeriesRenderer<HorzScaleItem, TData extends PrettyHistogramData<HorzScaleItem>> implements ICustomSeriesPaneRenderer {
	private _data: PaneRendererCustomData<HorzScaleItem, TData> | null = null;
	private _options: PrettyHistogramSeriesOptions | null = null;

	public draw(
		target: CanvasRenderingTarget2D,
		priceConverter: PriceToCoordinateConverter
	): void {
		target.useBitmapCoordinateSpace((scope: BitmapCoordinatesRenderingScope) =>
			this._drawImpl(scope, priceConverter)
		);
	}

	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: PrettyHistogramSeriesOptions
	): void {
		this._data = data;
		this._options = options;
	}

	private _drawImpl(
		renderingScope: BitmapCoordinatesRenderingScope,
		priceToCoordinate: PriceToCoordinateConverter
	): void {
		if (
			this._data === null ||
			this._data.bars.length === 0 ||
			this._data.visibleRange === null ||
			this._options === null
		) {
			return;
		}
		const options = this._options;
		const bars: PrettyHistogramBarItem[] = this._data.bars.map((bar: CustomBarItemData<HorzScaleItem, TData>) => {
			return {
				x: bar.x * renderingScope.horizontalPixelRatio,
				value: priceToCoordinate(bar.originalData.value!)! * renderingScope.verticalPixelRatio,
				color: bar.barColor ?? options.color,
			};
		});

		const zeroCoordinate = priceToCoordinate(0)! * renderingScope.verticalPixelRatio;

		const ctx = renderingScope.context;

		let prevColor: string | null = null;
		ctx.beginPath();
		const width = Math.max(1, Math.round(0.01 * options.widthPercent * this._data.barSpacing * renderingScope.horizontalPixelRatio));
		const radius = Math.floor(options.radius * renderingScope.horizontalPixelRatio);
		bars.forEach((item: PrettyHistogramBarItem) => {
			const color = item.color;
			if (prevColor !== null && prevColor !== color) {
				ctx.fill();
				ctx.beginPath();
			}
			ctx.fillStyle = color;
			const height = item.value - zeroCoordinate;
			const actualRadius = Math.floor(Math.min(radius, width / 2, Math.abs(height)));
			const vertRadius = Math.sign(height) * actualRadius;
			const left = Math.round(item.x - width / 2);
			const right = left + width;
			ctx.moveTo(left, zeroCoordinate);
			ctx.lineTo(left, item.value - vertRadius);
			ctx.arcTo(left, item.value, left + actualRadius, item.value, actualRadius);
			ctx.lineTo(right - actualRadius, item.value);
			ctx.arcTo(right, item.value, right, item.value - vertRadius, actualRadius);
			ctx.lineTo(right, zeroCoordinate);
			ctx.lineTo(left, zeroCoordinate);
			prevColor = color;
		});
		ctx.fill();
	}
}
