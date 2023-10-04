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
import { GroupedBarsData } from './data';
import { GroupedBarsSeriesOptions } from './options';
import {
	positionsBox,
	positionsLine,
} from '../../helpers/dimensions/positions';

/**
 * Proof of Concept WIP.
 * If we actually release this then we should use the tricks within
 * the histogram renderer to get this pixel perfect.
 */

interface SingleBar {
	x: number;
	y: number;
	color: string;
}

interface GroupedBarsBarItem {
	singleBars: SingleBar[];
	singleBarWidth: number;
}

export class GroupedBarsSeriesRenderer<TData extends GroupedBarsData>
	implements ICustomSeriesPaneRenderer
{
	_data: PaneRendererCustomData<Time, TData> | null = null;
	_options: GroupedBarsSeriesOptions | null = null;

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
		options: GroupedBarsSeriesOptions
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
		const barWidth = this._data.barSpacing;
		const groups: GroupedBarsBarItem[] = this._data.bars.map(bar => {
			const count = bar.originalData.values.length;
			const singleBarWidth = barWidth / (count + 1);
			const padding = singleBarWidth / 2;
			const startX = padding + bar.x - barWidth / 2 + singleBarWidth / 2;
			return {
				singleBarWidth,
				singleBars: bar.originalData.values.map((value, index) => ({
					y: priceToCoordinate(value) ?? 0,
					color: options.colors[index % options.colors.length],
					x: startX + index * singleBarWidth,
				})),
			};
		});

		const zeroY = priceToCoordinate(0) ?? 0;
		for (
			let i = this._data.visibleRange.from;
			i < this._data.visibleRange.to;
			i++
		) {
			const group = groups[i];
			let lastX: number;
			group.singleBars.forEach(bar => {
				const yPos = positionsBox(
					zeroY,
					bar.y,
					renderingScope.verticalPixelRatio
				);
				const xPos = positionsLine(
					bar.x,
					renderingScope.horizontalPixelRatio,
					group.singleBarWidth
				);
				renderingScope.context.beginPath();
				renderingScope.context.fillStyle = bar.color;
				const offset = lastX ? xPos.position - lastX : 0;
				renderingScope.context.fillRect(
					xPos.position - offset,
					yPos.position,
					xPos.length + offset,
					yPos.length
				);
				lastX = xPos.position + xPos.length;
			});
		}
	}
}
