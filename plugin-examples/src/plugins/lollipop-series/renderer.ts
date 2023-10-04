import {
	BitmapCoordinatesRenderingScope,
	CanvasRenderingTarget2D,
} from 'fancy-canvas';
import {
	Coordinate,
	ICustomSeriesPaneRenderer,
	PaneRendererCustomData,
	PriceToCoordinateConverter,
	Time,
} from 'lightweight-charts';
import { LollipopData } from './data';
import { LollipopSeriesOptions } from './options';
import {
	positionsBox,
	positionsLine,
} from '../../helpers/dimensions/positions';

interface LollipopBarItem {
	x: number;
	y: Coordinate | number;
}

export class LollipopSeriesRenderer<TData extends LollipopData>
	implements ICustomSeriesPaneRenderer
{
	_data: PaneRendererCustomData<Time, TData> | null = null;
	_options: LollipopSeriesOptions | null = null;

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
		options: LollipopSeriesOptions
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
		const bars: LollipopBarItem[] = this._data.bars.map(bar => {
			return {
				x: bar.x,
				y: priceToCoordinate(bar.originalData.value) ?? 0,
			};
		});

		const lineWidth = Math.min(this._options.lineWidth, this._data.barSpacing);

		const barWidth = this._data.barSpacing;
		const radius = Math.floor(barWidth / 2);
		const zeroY = priceToCoordinate(0);
		for (
			let i = this._data.visibleRange.from;
			i < this._data.visibleRange.to;
			i++
		) {
			const bar = bars[i];
			const xPosition = positionsLine(
				bar.x,
				renderingScope.horizontalPixelRatio,
				lineWidth
			);
			const yPositionBox = positionsBox(
				zeroY ?? 0,
				bar.y,
				renderingScope.verticalPixelRatio
			);
			renderingScope.context.beginPath();
			renderingScope.context.fillStyle = options.color;
			renderingScope.context.fillRect(
				xPosition.position,
				yPositionBox.position,
				xPosition.length,
				yPositionBox.length
			);
			renderingScope.context.arc(
				bar.x * renderingScope.horizontalPixelRatio,
				bar.y * renderingScope.verticalPixelRatio,
				radius * renderingScope.horizontalPixelRatio,
				0,
				Math.PI * 2
			);
			renderingScope.context.fill();
		}
	}
}
