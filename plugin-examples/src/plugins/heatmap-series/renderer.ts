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
import { HeatMapData } from './data';
import { HeatMapSeriesOptions } from './options';
import { fullBarWidth } from '../../helpers/dimensions/full-width';
import { positionsBox } from '../../helpers/dimensions/positions';

interface HeatMapBarItemCell {
	low: number;
	high: number;
	amount: number;
}

interface HeatMapBarItem {
	x: number;
	cells: HeatMapBarItemCell[];
}

export class HeatMapSeriesRenderer<TData extends HeatMapData>
	implements ICustomSeriesPaneRenderer
{
	_data: PaneRendererCustomData<Time, TData> | null = null;
	_options: HeatMapSeriesOptions | null = null;

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
		options: HeatMapSeriesOptions
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
		const bars: HeatMapBarItem[] = this._data.bars.map(bar => {
			return {
				x: bar.x,
				cells: bar.originalData.cells.map(cell => {
					return {
						amount: cell.amount,
						low:
							priceToCoordinate(cell.low)!,
						high:
							priceToCoordinate(cell.high)!,
					};
				}),
			};
		});
		const drawBorder = this._data.barSpacing > options.cellBorderWidth * 3;

		for (
			let i = this._data.visibleRange.from;
			i < this._data.visibleRange.to;
			i++
		) {
			const bar = bars[i];
			const fullWidth = fullBarWidth(
				bar.x,
				this._data.barSpacing / 2,
				renderingScope.horizontalPixelRatio
			);
			const borderWidthHorizontal = drawBorder ? options.cellBorderWidth * renderingScope.horizontalPixelRatio : 0;
			const borderWidthVertical = drawBorder ? options.cellBorderWidth * renderingScope.verticalPixelRatio : 0;
			for (const cell of bar.cells) {
				const verticalDimension = positionsBox(
					cell.low,
					cell.high,
					renderingScope.verticalPixelRatio
				);
				renderingScope.context.fillStyle = options.cellShader(cell.amount);
				renderingScope.context.fillRect(
					fullWidth.position + borderWidthHorizontal,
					verticalDimension.position + borderWidthVertical,
					fullWidth.length - borderWidthHorizontal * 2,
					verticalDimension.length - 1 - borderWidthVertical * 2
				);
				if (drawBorder && options.cellBorderWidth && options.cellBorderColor !== 'transparent') {
					renderingScope.context.beginPath();
					renderingScope.context.rect(
						fullWidth.position + borderWidthHorizontal / 2,
						verticalDimension.position + borderWidthVertical / 2,
						fullWidth.length - borderWidthHorizontal,
						verticalDimension.length - 1 - borderWidthVertical
					);
					renderingScope.context.strokeStyle = options.cellBorderColor;
					renderingScope.context.lineWidth = borderWidthHorizontal;
					renderingScope.context.stroke();
				}
			}
		}
	}
}
