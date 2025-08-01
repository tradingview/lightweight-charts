import {
	BitmapCoordinatesRenderingScope,
	CanvasRenderingTarget2D,
} from 'fancy-canvas';
import {
	ICustomSeriesPaneRenderer,
	PaneRendererCustomData,
	PriceToCoordinateConverter,
	Time,
} from 'lightweight-charts';
import { DualRangeHistogramData } from './data';
import { DualRangeHistogramSeriesOptions } from './options';
import {
	ColumnPosition,
	calculateColumnPositionsInPlace,
} from '../../helpers/dimensions/columns';
import { positionsBox } from '../../helpers/dimensions/positions';
import {
	drawRoundRectWithBorder,
	LeftTopRightTopRightBottomLeftBottomRadii,
} from './canvas-utils';

interface DualRangeHistogramBarItem {
	x: number;
	ys: number[];
	positive: boolean[];
	column?: ColumnPosition;
}

export class DualRangeHistogramSeriesRenderer<
	TData extends DualRangeHistogramData
> implements ICustomSeriesPaneRenderer
{
	_data: PaneRendererCustomData<Time, TData> | null = null;
	_options: DualRangeHistogramSeriesOptions | null = null;

	draw(
		target: CanvasRenderingTarget2D,
		priceConverter: PriceToCoordinateConverter
	): void {
		target.useBitmapCoordinateSpace(scope =>
			this._drawImpl(scope, priceConverter)
		);
	}

	update(
		data: PaneRendererCustomData<Time, TData>,
		options: DualRangeHistogramSeriesOptions
	): void {
		this._data = data;
		this._options = options;
	}

	_drawImpl(
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

		let maxValue = 0;
		for (
			let i = this._data.visibleRange.from;
			i < this._data.visibleRange.to;
			i++
		) {
			const values = this._data.bars[i].originalData.values;
			for (const v of values) {
				if (Math.abs(v) > maxValue) {
					maxValue = Math.abs(v);
				}
			}
		}

		const halfHeight = options.maxHeight / 2;

		const bars: DualRangeHistogramBarItem[] = this._data.bars.map(bar => {
			return {
				x: bar.x,
				ys: bar.originalData.values.map(value => {
					return (Math.abs(value) / maxValue) * Math.sign(value) * halfHeight;
				}),
				positive: bar.originalData.values.map(value => value >= 0),
			};
		});

		calculateColumnPositionsInPlace(
			bars,
			this._data.barSpacing,
			renderingScope.horizontalPixelRatio,
			this._data.visibleRange.from,
			this._data.visibleRange.to
		);

		const zeroY = priceToCoordinate(0) ?? 0;
		const borderWidth =
			this._data.barSpacing * renderingScope.horizontalPixelRatio < 4
				? 0
				: Math.max(1, 0.5 * renderingScope.horizontalPixelRatio);
		for (
			let i = this._data.visibleRange.from;
			i < this._data.visibleRange.to;
			i++
		) {
			const group = bars[i];
			const column = group.column;
			if (!column) continue;
			const width = Math.min(
				Math.max(
					renderingScope.horizontalPixelRatio,
					column.right - column.left
				),
				this._data.barSpacing * renderingScope.horizontalPixelRatio
			);
			group.ys.forEach((y, index) => {
				const color = options.colors[index % options.colors.length];
				const columnPosition = positionsBox(
					zeroY,
					zeroY - y,
					renderingScope.verticalPixelRatio
				);
				const radius =
					options.borderRadius[index % options.borderRadius.length] *
					renderingScope.verticalPixelRatio;
				const positive = group.positive[index];
				const actualRadius = Math.floor(
					Math.min(radius, width / 2, Math.abs(columnPosition.length))
				);
				const borderRadius: LeftTopRightTopRightBottomLeftBottomRadii = positive
					? [actualRadius, actualRadius, 0, 0]
					: [0, 0, actualRadius, actualRadius];
				drawRoundRectWithBorder(
					renderingScope.context,
					column.left,
					columnPosition.position,
					width,
					columnPosition.length,
					color,
					borderWidth,
					borderRadius,
					'transparent'
				);
			});
		}
	}
}
