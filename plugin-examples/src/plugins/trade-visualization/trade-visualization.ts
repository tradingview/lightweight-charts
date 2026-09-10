import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	AutoscaleInfo,
	Coordinate,
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	ISeriesPrimitive,
	Logical,
	PrimitivePaneViewZOrder,
	Time,
} from 'lightweight-charts';
import { PluginBase } from '../plugin-base';

export interface Execution {
	price: number;
	time: Time;
}

export interface Trade {
	open: Execution;
	close: Execution;
	stop: number;
	target: number;
}

export interface TradeVisualizationOptions {
	longColor: string;
	shortColor: string;
	profitColor: string;
	lossColor: string;
	stopColor: string;
	targetColor: string;
	tradeLineWidth: number;
	boundaryLineWidth: number;
}

const defaultOptions: TradeVisualizationOptions = {
	longColor: '#089981',
	shortColor: '#f23645',
	profitColor: 'rgba(8, 153, 129, 0.18)',
	lossColor: 'rgba(242, 54, 69, 0.18)',
	stopColor: '#f23645',
	targetColor: '#089981',
	tradeLineWidth: 2,
	boundaryLineWidth: 1,
};

type TradeDirection = 'long' | 'short';

interface TradeRendererData {
	openX: Coordinate;
	closeX: Coordinate;
	openY: Coordinate;
	closeY: Coordinate;
	stopY: Coordinate;
	targetY: Coordinate;
	direction: TradeDirection;
	profitable: boolean;
}

interface TradeVisualizationViewData {
	trades: readonly TradeRendererData[];
	options: Readonly<TradeVisualizationOptions>;
}

function cloneExecution(execution: Execution): Execution {
	return { price: execution.price, time: execution.time };
}

function cloneTrade(trade: Trade): Trade {
	return {
		open: cloneExecution(trade.open),
		close: cloneExecution(trade.close),
		stop: trade.stop,
		target: trade.target,
	};
}

function validatePrice(price: number, field: string, tradeIndex: number): void {
	if (!Number.isFinite(price)) {
		throw new TypeError(
			`Trade at index ${tradeIndex} has a non-finite ${field} price: ${price}`
		);
	}
}

function tradeDirection(trade: Trade, tradeIndex: number): TradeDirection {
	const isLong = trade.target > trade.open.price && trade.stop < trade.open.price;
	if (isLong) {
		return 'long';
	}

	const isShort =
		trade.target < trade.open.price && trade.stop > trade.open.price;
	if (isShort) {
		return 'short';
	}

	throw new RangeError(
		`Trade at index ${tradeIndex} must bracket its open price with its stop and target`
	);
}

function normalizeTrades(trades: readonly Trade[]): Trade[] {
	return trades.map((trade, tradeIndex) => {
		validatePrice(trade.open.price, 'open', tradeIndex);
		validatePrice(trade.close.price, 'close', tradeIndex);
		validatePrice(trade.stop, 'stop', tradeIndex);
		validatePrice(trade.target, 'target', tradeIndex);
		tradeDirection(trade, tradeIndex);
		return cloneTrade(trade);
	});
}

function validateLineWidth(width: number, field: string): void {
	if (!Number.isFinite(width) || width <= 0) {
		throw new RangeError(`${field} must be a positive finite number: ${width}`);
	}
}

function normalizeOptions(
	options: Partial<TradeVisualizationOptions>
): TradeVisualizationOptions {
	const normalizedOptions = { ...defaultOptions, ...options };
	validateLineWidth(normalizedOptions.tradeLineWidth, 'tradeLineWidth');
	validateLineWidth(normalizedOptions.boundaryLineWidth, 'boundaryLineWidth');
	return normalizedOptions;
}

function isProfitable(trade: Trade, direction: TradeDirection): boolean {
	return direction === 'long'
		? trade.close.price >= trade.open.price
		: trade.close.price <= trade.open.price;
}

class TradeVisualizationPaneRenderer implements IPrimitivePaneRenderer {
	private readonly _data: TradeVisualizationViewData;

	public constructor(data: TradeVisualizationViewData) {
		this._data = data;
	}

	public draw(target: CanvasRenderingTarget2D): void {
		target.useMediaCoordinateSpace(scope => {
			const context = scope.context;
			context.save();

			for (const trade of this._data.trades) {
				const left = Math.min(trade.openX, trade.closeX);
				const right = Math.max(trade.openX, trade.closeX);
				const top = Math.min(trade.stopY, trade.targetY);
				const bottom = Math.max(trade.stopY, trade.targetY);

				context.fillStyle = trade.profitable
					? this._data.options.profitColor
					: this._data.options.lossColor;
				context.fillRect(left, top, right - left, bottom - top);

				context.lineWidth = this._data.options.boundaryLineWidth;
				context.strokeStyle = this._data.options.stopColor;
				context.beginPath();
				context.moveTo(left, trade.stopY);
				context.lineTo(right, trade.stopY);
				context.stroke();

				context.strokeStyle = this._data.options.targetColor;
				context.beginPath();
				context.moveTo(left, trade.targetY);
				context.lineTo(right, trade.targetY);
				context.stroke();

				context.lineWidth = this._data.options.tradeLineWidth;
				context.strokeStyle =
					trade.direction === 'long'
						? this._data.options.longColor
						: this._data.options.shortColor;
				context.beginPath();
				context.moveTo(trade.openX, trade.openY);
				context.lineTo(trade.closeX, trade.closeY);
				context.stroke();
			}

			context.restore();
		});
	}
}

class TradeVisualizationPaneView implements IPrimitivePaneView {
	private readonly _source: TradeVisualization;
	private _data: TradeVisualizationViewData;

	public constructor(source: TradeVisualization) {
		this._source = source;
		this._data = {
			trades: [],
			options: source.options(),
		};
	}

	public update(): void {
		const timeScale = this._source.chart.timeScale();
		const rendererData: TradeRendererData[] = [];

		for (const [tradeIndex, trade] of this._source.trades().entries()) {
			const openX = timeScale.timeToCoordinate(trade.open.time);
			const closeX = timeScale.timeToCoordinate(trade.close.time);
			const openY = this._source.series.priceToCoordinate(trade.open.price);
			const closeY = this._source.series.priceToCoordinate(trade.close.price);
			const stopY = this._source.series.priceToCoordinate(trade.stop);
			const targetY = this._source.series.priceToCoordinate(trade.target);

			if (
				openX === null ||
				closeX === null ||
				openY === null ||
				closeY === null ||
				stopY === null ||
				targetY === null
			) {
				continue;
			}

			const direction = tradeDirection(trade, tradeIndex);
			rendererData.push({
				openX,
				closeX,
				openY,
				closeY,
				stopY,
				targetY,
				direction,
				profitable: isProfitable(trade, direction),
			});
		}

		this._data = {
			trades: rendererData,
			options: this._source.options(),
		};
	}

	public renderer(): IPrimitivePaneRenderer {
		return new TradeVisualizationPaneRenderer(this._data);
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return 'top';
	}
}

export class TradeVisualization
	extends PluginBase
	implements ISeriesPrimitive<Time>
{
	private readonly _paneViews: readonly TradeVisualizationPaneView[];
	private _trades: Trade[];
	private _options: TradeVisualizationOptions;

	public constructor(
		trades: readonly Trade[],
		options: Partial<TradeVisualizationOptions>
	) {
		super();
		this._trades = normalizeTrades(trades);
		this._options = normalizeOptions(options);
		this._paneViews = [new TradeVisualizationPaneView(this)];
	}

	public setTrades(trades: readonly Trade[]): void {
		this._trades = normalizeTrades(trades);
		this.requestUpdate();
	}

	public applyOptions(options: Partial<TradeVisualizationOptions>): void {
		this._options = normalizeOptions({ ...this._options, ...options });
		this.requestUpdate();
	}

	public trades(): readonly Trade[] {
		return this._trades.map(cloneTrade);
	}

	public options(): Readonly<TradeVisualizationOptions> {
		return { ...this._options };
	}

	public updateAllViews(): void {
		this._paneViews.forEach(paneView => paneView.update());
	}

	public paneViews(): readonly IPrimitivePaneView[] {
		return this._paneViews;
	}

	public autoscaleInfo(
		startTimePoint: Logical,
		endTimePoint: Logical
	): AutoscaleInfo | null {
		let minValue = Number.POSITIVE_INFINITY;
		let maxValue = Number.NEGATIVE_INFINITY;
		const timeScale = this.chart.timeScale();

		for (const trade of this._trades) {
			const openIndex = timeScale.timeToIndex(trade.open.time, true);
			const closeIndex = timeScale.timeToIndex(trade.close.time, true);
			if (openIndex === null || closeIndex === null) {
				continue;
			}

			const firstTradeIndex = Math.min(openIndex, closeIndex);
			const lastTradeIndex = Math.max(openIndex, closeIndex);
			const isOutsideVisibleRange =
				endTimePoint < firstTradeIndex || startTimePoint > lastTradeIndex;
			if (isOutsideVisibleRange) {
				continue;
			}

			minValue = Math.min(
				minValue,
				trade.open.price,
				trade.close.price,
				trade.stop,
				trade.target
			);
			maxValue = Math.max(
				maxValue,
				trade.open.price,
				trade.close.price,
				trade.stop,
				trade.target
			);
		}

		if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
			return null;
		}

		return {
			priceRange: {
				minValue,
				maxValue,
			},
		};
	}
}
