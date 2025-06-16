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
import { _CLASSNAME_Data } from './data';
import { _CLASSNAME_Options } from './options';

interface _CLASSNAME_Item {
	x: number;
	high: number;
	low: number;
}

export class _CLASSNAME_Renderer<TData extends _CLASSNAME_Data>
	implements ICustomSeriesPaneRenderer
{
	_data: PaneRendererCustomData<Time, TData> | null = null;
	_options: _CLASSNAME_Options | null = null;

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
		options: _CLASSNAME_Options
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
		const bars: _CLASSNAME_Item[] = this._data.bars.map(bar => {
			return {
				x: bar.x * renderingScope.horizontalPixelRatio,
				high: priceToCoordinate(bar.originalData.high)! * renderingScope.verticalPixelRatio,
				low: priceToCoordinate(bar.originalData.low)! * renderingScope.verticalPixelRatio,
			};
		});

		const ctx = renderingScope.context;
		ctx.beginPath();
		const lowLine = new Path2D();
		const highLine = new Path2D();
		const firstBar = bars[this._data.visibleRange.from];
		lowLine.moveTo(firstBar.x, firstBar.low);
		for (
			let i = this._data.visibleRange.from + 1;
			i < this._data.visibleRange.to;
			i++
		) {
			const bar = bars[i];
			lowLine.lineTo(bar.x, bar.low);
		}

		const lastBar = bars[this._data.visibleRange.to - 1];
		highLine.moveTo(lastBar.x, lastBar.high);
		for (
			let i = this._data.visibleRange.to - 2;
			i >= this._data.visibleRange.from;
			i--
		) {
			const bar = bars[i];
			highLine.lineTo(bar.x, bar.high);
		}

		const area = new Path2D(lowLine);
		area.lineTo(lastBar.x, lastBar.high);
		area.addPath(highLine);
		area.lineTo(firstBar.x, firstBar.low);
		area.closePath();
		ctx.fillStyle = options.areaColor;
		ctx.fill(area);

		ctx.lineJoin = 'round';
		ctx.strokeStyle = options.lowLineColor;
		ctx.lineWidth = options.lowLineWidth * renderingScope.verticalPixelRatio;
		ctx.stroke(lowLine);
		ctx.strokeStyle = options.highLineColor;
		ctx.lineWidth = options.highLineWidth * renderingScope.verticalPixelRatio;
		ctx.stroke(highLine);
	}
}
