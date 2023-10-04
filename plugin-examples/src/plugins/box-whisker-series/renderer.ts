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
import { WhiskerData } from './sample-data';
import { WhiskerBoxSeriesOptions } from './options';
import {
	positionsBox,
	positionsLine,
} from '../../helpers/dimensions/positions';
import { gridAndCrosshairMediaWidth } from '../../helpers/dimensions/crosshair-width';
import { candlestickWidth } from '../../helpers/dimensions/candles';

interface DesiredWidths {
	body: number;
	medianLine: number;
	extremeLines: number;
	outlierRadius: number;
}

function desiredWidths(barSpacing: number): DesiredWidths {
	// we want these in media coordinates so set pixelRatio to 1
	const bodyWidth = candlestickWidth(barSpacing, 1);
	const medianWidth = Math.floor(barSpacing);
	const lineWidth = candlestickWidth(barSpacing / 2, 1);

	return {
		body: bodyWidth,
		medianLine: Math.max(medianWidth, bodyWidth),
		extremeLines: lineWidth,
		outlierRadius: Math.min(bodyWidth, 4),
	};
}

type QuartileTuple = [number, number, number, number, number];

interface WhiskerBarItem {
	quartilesY: QuartileTuple;
	outliers: number[];
	x: number;
}

export class WhiskerBoxSeriesRenderer<TData extends WhiskerData>
	implements ICustomSeriesPaneRenderer
{
	_data: PaneRendererCustomData<Time, TData> | null = null;
	_options: WhiskerBoxSeriesOptions | null = null;

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
		options: WhiskerBoxSeriesOptions
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
		const bars: WhiskerBarItem[] = this._data.bars.map(bar => {
			return {
				quartilesY: bar.originalData.quartiles.map(price => {
					return (priceToCoordinate(price) ?? 0) as number;
				}) as QuartileTuple,
				outliers: (bar.originalData.outliers || []).map(price => {
					return (priceToCoordinate(price) ?? 0) as number;
				}),
				x: bar.x,
			};
		});

		const widths = desiredWidths(this._data.barSpacing);
		const verticalLineWidth = gridAndCrosshairMediaWidth(
			renderingScope.horizontalPixelRatio
		);
		const horizontalLineWidth = gridAndCrosshairMediaWidth(
			renderingScope.verticalPixelRatio
		);

		for (
			let i = this._data.visibleRange.from;
			i < this._data.visibleRange.to;
			i++
		) {
			const bar = bars[i];
			if (widths.outlierRadius > 2) {
				this._drawOutliers(
					renderingScope.context,
					bar,
					widths.outlierRadius,
					options,
					renderingScope.horizontalPixelRatio,
					renderingScope.verticalPixelRatio
				);
			}
			this._drawWhisker(
				renderingScope.context,
				bar,
				widths.extremeLines,
				options,
				renderingScope.horizontalPixelRatio,
				renderingScope.verticalPixelRatio,
				verticalLineWidth,
				horizontalLineWidth
			);
			this._drawBox(
				renderingScope.context,
				bar,
				widths.body,
				options,
				renderingScope.horizontalPixelRatio,
				renderingScope.verticalPixelRatio
			);
			this._drawMedianLine(
				renderingScope.context,
				bar,
				widths.medianLine,
				options,
				renderingScope.horizontalPixelRatio,
				renderingScope.verticalPixelRatio,
				horizontalLineWidth
			);
		}
	}

	_drawWhisker(
		ctx: CanvasRenderingContext2D,
		bar: WhiskerBarItem,
		extremeLineWidth: number,
		options: WhiskerBoxSeriesOptions,
		horizontalPixelRatio: number,
		verticalPixelRatio: number,
		wickWidth: number,
		horizontalWickWidth: number
	) {
		ctx.save();
		ctx.fillStyle = options.whiskerColor;
		const verticalLinePosition = positionsLine(
			bar.x,
			horizontalPixelRatio,
			wickWidth
		);
		const topWhiskerYPositions = positionsBox(
			bar.quartilesY[0],
			bar.quartilesY[1],
			verticalPixelRatio
		);
		ctx.fillRect(
			verticalLinePosition.position,
			topWhiskerYPositions.position,
			verticalLinePosition.length,
			topWhiskerYPositions.length
		);

		const bottomWhiskerYPositions = positionsBox(
			bar.quartilesY[3],
			bar.quartilesY[4],
			verticalPixelRatio
		);
		ctx.fillRect(
			verticalLinePosition.position,
			bottomWhiskerYPositions.position,
			verticalLinePosition.length,
			bottomWhiskerYPositions.length
		);

		const horizontalLinePosition = positionsLine(
			bar.x,
			horizontalPixelRatio,
			extremeLineWidth
		);
		const topWhiskerHorizontalYPosition = positionsLine(
			bar.quartilesY[4],
			verticalPixelRatio,
			horizontalWickWidth
		);
		ctx.fillRect(
			horizontalLinePosition.position,
			topWhiskerHorizontalYPosition.position,
			horizontalLinePosition.length,
			topWhiskerHorizontalYPosition.length
		);

		const bottomWhiskerHorizontalYPosition = positionsLine(
			bar.quartilesY[0],
			verticalPixelRatio,
			horizontalWickWidth
		);
		ctx.fillRect(
			horizontalLinePosition.position,
			bottomWhiskerHorizontalYPosition.position,
			horizontalLinePosition.length,
			bottomWhiskerHorizontalYPosition.length
		);
		ctx.restore();
	}

	_drawBox(
		ctx: CanvasRenderingContext2D,
		bar: WhiskerBarItem,
		bodyWidth: number,
		options: WhiskerBoxSeriesOptions,
		horizontalPixelRatio: number,
		verticalPixelRatio: number
	) {
		ctx.save();
		const upperQuartileYPositions = positionsBox(
			bar.quartilesY[2],
			bar.quartilesY[3],
			verticalPixelRatio
		);
		const lowerQuartileYPositions = positionsBox(
			bar.quartilesY[1],
			bar.quartilesY[2],
			verticalPixelRatio
		);
		const xPositions = positionsLine(bar.x, horizontalPixelRatio, bodyWidth);
		ctx.fillStyle = options.lowerQuartileFill;
		ctx.fillRect(
			xPositions.position,
			lowerQuartileYPositions.position,
			xPositions.length,
			lowerQuartileYPositions.length
		);
		ctx.fillStyle = options.upperQuartileFill;
		ctx.fillRect(
			xPositions.position,
			upperQuartileYPositions.position,
			xPositions.length,
			upperQuartileYPositions.length
		);
		ctx.restore();
	}

	_drawMedianLine(
		ctx: CanvasRenderingContext2D,
		bar: WhiskerBarItem,
		medianLineWidth: number,
		options: WhiskerBoxSeriesOptions,
		horizontalPixelRatio: number,
		verticalPixelRatio: number,
		horizontalLineWidth: number
	) {
		const xPos = positionsLine(bar.x, horizontalPixelRatio, medianLineWidth);
		const yPos = positionsLine(
			bar.quartilesY[2],
			verticalPixelRatio,
			horizontalLineWidth
		);
		ctx.save();
		ctx.fillStyle = options.whiskerColor;
		ctx.fillRect(xPos.position, yPos.position, xPos.length, yPos.length);
		ctx.restore();
	}

	_drawOutliers(
		ctx: CanvasRenderingContext2D,
		bar: WhiskerBarItem,
		extremeLineWidth: number,
		options: WhiskerBoxSeriesOptions,
		horizontalPixelRatio: number,
		verticalPixelRatio: number
	) {
		ctx.save();
		const xPos = positionsLine(bar.x, horizontalPixelRatio, 1, true);
		ctx.fillStyle = options.outlierColor;
		ctx.lineWidth = 0;
		bar.outliers.forEach(outlier => {
			ctx.beginPath();
			const yPos = positionsLine(outlier, verticalPixelRatio, 1, true);
			ctx.arc(xPos.position, yPos.position, extremeLineWidth, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();
		});
		ctx.restore();
	}
}
