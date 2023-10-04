import {
	BitmapCoordinatesRenderingScope,
	CanvasRenderingTarget2D,
} from 'fancy-canvas';
import {
	ICustomSeriesPaneRenderer,
	PaneRendererCustomData,
	PriceToCoordinateConverter,
	Range,
	Time,
} from 'lightweight-charts';
import { StackedAreaData } from './data';
import { StackedAreaSeriesOptions } from './options';

interface Position {
	x: number;
	y: number;
}

interface LinePathData {
	path: Path2D;
	first: Position;
	last: Position;
}

interface StackedAreaBarItem {
	x: number;
	ys: number[];
}

function cumulativeBuildUp(arr: number[]): number[] {
	let sum = 0;
	return arr.map(value => {
		const newValue = sum + value;
		sum = newValue;
		return newValue;
	});
}

export class StackedAreaSeriesRenderer<TData extends StackedAreaData>
	implements ICustomSeriesPaneRenderer
{
	_data: PaneRendererCustomData<Time, TData> | null = null;
	_options: StackedAreaSeriesOptions | null = null;

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
		options: StackedAreaSeriesOptions
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
		const bars: StackedAreaBarItem[] = this._data.bars.map(bar => {
			return {
				x: bar.x,
				ys: cumulativeBuildUp(bar.originalData.values).map(
					value => priceToCoordinate(value) ?? 0
				),
			};
		});
		const zeroY = priceToCoordinate(0) ?? 0;
		const linesMeshed = this._createLinePaths(
			bars,
			this._data.visibleRange,
			renderingScope,
			zeroY * renderingScope.verticalPixelRatio
		);
		const areaPaths = this._createAreas(linesMeshed);
		const colorsCount = options.colors.length;
		areaPaths.forEach((areaPath, index) => {
			renderingScope.context.fillStyle =
				options.colors[index % colorsCount].area;
			renderingScope.context.fill(areaPath);
		});
		renderingScope.context.lineWidth =
			options.lineWidth * renderingScope.verticalPixelRatio;
		renderingScope.context.lineJoin = 'round';
		linesMeshed.forEach((linePath, index) => {
			if (index == 0) return;
			renderingScope.context.beginPath();
			renderingScope.context.strokeStyle =
				options.colors[(index - 1) % colorsCount].line;
			renderingScope.context.stroke(linePath.path);
		});
	}

	_createLinePaths(
		bars: StackedAreaBarItem[],
		visibleRange: Range<number>,
		renderingScope: BitmapCoordinatesRenderingScope,
		zeroY: number
	) {
		const { horizontalPixelRatio, verticalPixelRatio } = renderingScope;
		const oddLines: LinePathData[] = [];
		const evenLines: LinePathData[] = [];
		let firstBar = true;
		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const stack = bars[i];
			let lineIndex = 0;
			stack.ys.forEach((yMedia, index) => {
				if (index % 2 !== 0) {
					return; // only doing odd at the moment
				}
				const x = stack.x * horizontalPixelRatio;
				const y = yMedia * verticalPixelRatio;
				if (firstBar) {
					oddLines[lineIndex] = {
						path: new Path2D(),
						first: { x, y },
						last: { x, y },
					};
					oddLines[lineIndex].path.moveTo(x, y);
				} else {
					oddLines[lineIndex].path.lineTo(x, y);
					oddLines[lineIndex].last.x = x;
					oddLines[lineIndex].last.y = y;
				}
				lineIndex += 1;
			});
			firstBar = false;
		}
		firstBar = true;
		for (let i = visibleRange.to - 1; i >= visibleRange.from; i--) {
			const stack = bars[i];
			let lineIndex = 0;
			stack.ys.forEach((yMedia, index) => {
				if (index % 2 === 0) {
					return; // only doing even at the moment
				}
				const x = stack.x * horizontalPixelRatio;
				const y = yMedia * verticalPixelRatio;
				if (firstBar) {
					evenLines[lineIndex] = {
						path: new Path2D(),
						first: { x, y },
						last: { x, y },
					};
					evenLines[lineIndex].path.moveTo(x, y);
				} else {
					evenLines[lineIndex].path.lineTo(x, y);
					evenLines[lineIndex].last.x = x;
					evenLines[lineIndex].last.y = y;
				}
				lineIndex += 1;
			});
			firstBar = false;
		}

		const baseLine = {
			path: new Path2D(),
			first: { x: oddLines[0].last.x, y: zeroY },
			last: { x: oddLines[0].first.x, y: zeroY },
		};
		baseLine.path.moveTo(oddLines[0].last.x, zeroY);
		baseLine.path.lineTo(oddLines[0].first.x, zeroY);
		const linesMeshed: LinePathData[] = [baseLine];
		for (let i = 0; i < oddLines.length; i++) {
			linesMeshed.push(oddLines[i]);
			if (i < evenLines.length) {
				linesMeshed.push(evenLines[i]);
			}
		}

		return linesMeshed;
	}

	_createAreas(linesMeshed: LinePathData[]): Path2D[] {
		const areas: Path2D[] = [];
		for (let i = 1; i < linesMeshed.length; i++) {
			const areaPath = new Path2D(linesMeshed[i - 1].path);
			areaPath.lineTo(linesMeshed[i].first.x, linesMeshed[i].first.y);
			areaPath.addPath(linesMeshed[i].path);
			areaPath.lineTo(linesMeshed[i - 1].first.x, linesMeshed[i - 1].first.y);
			areaPath.closePath();
			areas.push(areaPath);
		}
		return areas;
	}
}
