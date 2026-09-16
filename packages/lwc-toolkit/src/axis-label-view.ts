import { Coordinate, ISeriesPrimitiveAxisView } from 'lightweight-charts';

/**
 * Everything {@link AxisLabelView} needs to draw one label on a price or a time
 * axis. `coordinate` returns `null` when the value cannot be placed right now –
 * an unresolvable time, or a price outside the current scale – and the label is
 * then hidden instead of being drawn at the top / left edge of the axis.
 */
export interface AxisLabelSource {
	/** Distance from the top (price axis) or from the left (time axis), or `null` when unresolvable. */
	coordinate(): Coordinate | null;
	/** Text of the label. */
	text(): string;
	/** Text colour of the label. */
	textColor(): string;
	/** Background colour of the label. */
	backColor(): string;
	/** Whether the label should be drawn at all (default: `true`). */
	visible?(): boolean;
	/** Whether the tick mark line should be drawn (default: `true`). */
	tickVisible?(): boolean;
}

/**
 * The coordinate reported for a label whose source coordinate is `null`.
 *
 * The library asks for a number, so an unresolvable label is pushed far off the
 * axis rather than being reported at `0` (which would leave a gap in the label
 * layout, and draw the label at the very top / left edge if `visible` were
 * ignored).
 */
export const OFFSCREEN_LABEL_COORDINATE = -1e5;

/**
 * A ready-made `ISeriesPrimitiveAxisView` over an {@link AxisLabelSource}, for
 * labels on the price axis or on the time axis.
 *
 * The source is read on every call, so there is no separate update step to keep
 * in sync: a view built over a source which resolves its coordinate from the
 * chart is always current. Whenever the source coordinate is `null` the view
 * reports {@link OFFSCREEN_LABEL_COORDINATE} and `visible: false`, so a label
 * for a time or a price which cannot be placed is never drawn at coordinate 0.
 */
export class AxisLabelView implements ISeriesPrimitiveAxisView {
	private readonly _source: AxisLabelSource;

	public constructor(source: AxisLabelSource) {
		this._source = source;
	}

	/** The source this view draws, as passed to the constructor. */
	public source(): AxisLabelSource {
		return this._source;
	}

	public coordinate(): number {
		return this._source.coordinate() ?? OFFSCREEN_LABEL_COORDINATE;
	}

	public text(): string {
		return this._source.text();
	}

	public textColor(): string {
		return this._source.textColor();
	}

	public backColor(): string {
		return this._source.backColor();
	}

	public visible(): boolean {
		if (this._source.coordinate() === null) {
			return false;
		}
		return this._source.visible?.() ?? true;
	}

	public tickVisible(): boolean {
		if (this._source.coordinate() === null) {
			return false;
		}
		return this._source.tickVisible?.() ?? true;
	}
}
