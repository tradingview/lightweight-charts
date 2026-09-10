import {
	CustomData,
	CustomSeriesOptions,
	ICustomSeriesPaneRenderer,
	PaneRendererCustomData,
	PriceToCoordinateConverter,
	Time,
} from 'lightweight-charts';

/**
 * The canvas rendering target a custom series renderer is handed by the chart.
 *
 * Derived from the library's own `draw` signature so that the toolkit does not
 * have to depend on `fancy-canvas` directly; it is the same type.
 */
export type CanvasRenderingTarget2D = Parameters<
	ICustomSeriesPaneRenderer['draw']
>[0];

/**
 * The rendering scope passed to `useBitmapCoordinateSpace`: the 2d context plus
 * the media/bitmap sizes and the pixel ratios needed for pixel-perfect drawing.
 */
export type BitmapCoordinatesRenderingScope = Parameters<
	Parameters<CanvasRenderingTarget2D['useBitmapCoordinateSpace']>[0]
>[0];

/**
 * Everything {@link CustomSeriesRendererBase.drawImpl} needs for one paint,
 * with the values the base class has already checked narrowed to non-null.
 */
export interface CustomSeriesDrawArgs<
	HorzScaleItem,
	TData extends CustomData<HorzScaleItem>,
	TOptions extends CustomSeriesOptions,
> {
	/** Bars, bar spacing and visible range for this paint. */
	data: PaneRendererCustomData<HorzScaleItem, TData>;
	/** Current series options. */
	options: TOptions;
	/** Converts a price into a media coordinate, or `null` when off-scale. */
	priceToCoordinate: PriceToCoordinateConverter;
	/** First visible bar index (`data.visibleRange.from`). */
	from: number;
	/** End of the visible range, exclusive (`data.visibleRange.to`). */
	to: number;
	/** Whether the series is hovered. `false` on hosts which do not pass it. */
	isHovered: boolean;
	/** Hit test data for the hovered item, when the host provides it. */
	hitTestData?: unknown;
}

/**
 * Base class for a custom series pane renderer: it stores the data and options
 * handed over by `update`, performs the checks every renderer has to repeat
 * (no data, no visible range, empty visible range) and only then enters the
 * bitmap coordinate space and calls {@link CustomSeriesRendererBase.drawImpl}.
 *
 * Subclasses implement `drawImpl` and may read the protected `data` and
 * `options` fields, although everything needed for a paint is also handed to
 * `drawImpl` already narrowed.
 */
export abstract class CustomSeriesRendererBase<
	HorzScaleItem = Time,
	TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>,
	TOptions extends CustomSeriesOptions = CustomSeriesOptions,
> implements ICustomSeriesPaneRenderer
{
	/** Latest data passed to {@link CustomSeriesRendererBase.update}. */
	protected data: PaneRendererCustomData<HorzScaleItem, TData> | null = null;
	/** Latest options passed to {@link CustomSeriesRendererBase.update}. */
	protected options: TOptions | null = null;

	/** Stores the data and options for the next paint. */
	public update(
		data: PaneRendererCustomData<HorzScaleItem, TData>,
		options: TOptions
	): void {
		this.data = data;
		this.options = options;
	}

	/**
	 * Draws the series. `isHovered` and `hitTestData` are optional because
	 * hosts older than the version which added them call `draw` with two
	 * arguments; `isHovered` is then reported as `false`.
	 */
	public draw(
		target: CanvasRenderingTarget2D,
		priceConverter: PriceToCoordinateConverter,
		isHovered?: boolean,
		hitTestData?: unknown
	): void {
		const data = this.data;
		const options = this.options;
		if (data === null || options === null || data.bars.length === 0) {
			return;
		}
		const visibleRange = data.visibleRange;
		if (visibleRange === null) {
			return;
		}
		const { from, to } = visibleRange;
		if (from >= to) {
			return;
		}
		target.useBitmapCoordinateSpace(
			(scope: BitmapCoordinatesRenderingScope) =>
				this.drawImpl(scope, {
					data,
					options,
					priceToCoordinate: priceConverter,
					from,
					to,
					isHovered: isHovered ?? false,
					hitTestData,
				})
		);
	}

	/**
	 * Draws one frame inside the bitmap coordinate space. Called only when
	 * there is data and a non-empty visible range to draw.
	 */
	protected abstract drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		args: CustomSeriesDrawArgs<HorzScaleItem, TData, TOptions>
	): void;
}
