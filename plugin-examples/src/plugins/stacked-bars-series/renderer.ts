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
import { StackedBarsData } from './data';
import { StackedBarsSeriesOptions } from './options';
import {
	ColumnPosition,
	calculateColumnPositionsInPlace,
} from '../../helpers/dimensions/columns';
import { positionsBox } from '../../helpers/dimensions/positions';

interface StackedBarsBarItem {
	x: number;
	ys: number[];
	column?: ColumnPosition;
}

function cumulativeBuildUp(arr: number[]): number[] {
	let sum = 0;
	return arr.map(value => {
		const newValue = sum + value;
		sum = newValue;
		return newValue;
	});
}

export class StackedBarsSeriesRenderer<TData extends StackedBarsData>
	implements ICustomSeriesPaneRenderer
{
	_data: PaneRendererCustomData<Time, TData> | null = null;
	_options: StackedBarsSeriesOptions | null = null;

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
		options: StackedBarsSeriesOptions
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
		const bars: StackedBarsBarItem[] = this._data.bars.map(bar => {
			return {
				x: bar.x,
				ys: cumulativeBuildUp(bar.originalData.values).map(
					value => priceToCoordinate(value) ?? 0
				),
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
		for (
			let i = this._data.visibleRange.from;
			i < this._data.visibleRange.to;
			i++
		) {
			const stack = bars[i];
			const column = stack.column;
			if (!column) return;
			let previousY = zeroY;
			const width = Math.min(Math.max(renderingScope.horizontalPixelRatio, column.right - column.left), this._data.barSpacing * renderingScope.horizontalPixelRatio);
			stack.ys.forEach((y, index) => {
				const color = options.colors[index % options.colors.length];
				const stackBoxPositions = positionsBox(previousY, y, renderingScope.verticalPixelRatio);
				renderingScope.context.fillStyle = color;
				renderingScope.context.fillRect(
					column.left,
					stackBoxPositions.position,
					width,
					stackBoxPositions.length
				);
				previousY = y;
			});
		}
	}
}
