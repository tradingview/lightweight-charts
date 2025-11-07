import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { undefinedIfNull } from '../../helpers/strict-type-checks';

import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { IChartModelBase } from '../chart-model';
import { Coordinate } from '../coordinate';
import {
	CustomBarItemData,
	CustomConflationContext,
	CustomData,
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	ICustomSeriesPaneRenderer,
	ICustomSeriesPaneView,
	PriceToCoordinateConverter,
} from '../icustom-series';
import { ISeries } from '../iseries';
import { PriceScale } from '../price-scale';
import { SeriesPlotRow } from '../series-data';
import { SeriesOptionsMap } from '../series-options';
import { TimedValue } from '../time-data';
import { ITimeScale } from '../time-scale';
import { ISeriesCustomPaneView } from './pane-view';
import { SeriesPaneViewBase } from './series-pane-view-base';

type CustomBarItemBase = TimedValue;

interface CustomBarItem extends CustomBarItemBase {
	barColor: string;
	originalData?: Record<string, unknown>;
}

class CustomSeriesPaneRendererWrapper implements IPaneRenderer {
	private _sourceRenderer: ICustomSeriesPaneRenderer;
	private _priceScale: PriceToCoordinateConverter;
	public constructor(
		sourceRenderer: ICustomSeriesPaneRenderer,
		priceScale: PriceToCoordinateConverter
	) {
		this._sourceRenderer = sourceRenderer;
		this._priceScale = priceScale;
	}

	public draw(
		target: CanvasRenderingTarget2D,
		isHovered: boolean,
		hitTestData?: unknown
	): void {
		this._sourceRenderer.draw(target, this._priceScale, isHovered, hitTestData);
	}
}

export class SeriesCustomPaneView extends SeriesPaneViewBase<
	'Custom'& keyof SeriesOptionsMap,
	CustomBarItem,
	CustomSeriesPaneRendererWrapper
> implements ISeriesCustomPaneView {
	protected readonly _renderer: CustomSeriesPaneRendererWrapper;
	private readonly _paneView: ICustomSeriesPaneView<unknown>;

	public constructor(
		series: ISeries<'Custom' & keyof SeriesOptionsMap>,
		model: IChartModelBase,
		paneView: ICustomSeriesPaneView<unknown>
	) {
		super(series, model, false);
		this._paneView = paneView;
		this._renderer = new CustomSeriesPaneRendererWrapper(
			this._paneView.renderer(),
			(price: number) => {
				const firstValue = series.firstValue();
				if (firstValue === null) {
					return null;
				}
				return series.priceScale().priceToCoordinate(price, firstValue.value);
			}
		);
	}

	public get conflationReducer(): ((item1: CustomConflationContext<unknown, CustomData<unknown>>, item2: CustomConflationContext<unknown, CustomData<unknown>>) => CustomData<unknown>) | undefined {
		// eslint-disable-next-line @typescript-eslint/unbound-method
		return this._paneView.conflationReducer;
	}

	public priceValueBuilder(plotRow: CustomData<unknown> | CustomSeriesWhitespaceData<unknown>): CustomSeriesPricePlotValues {
		return this._paneView.priceValueBuilder(plotRow);
	}

	public isWhitespace(data: CustomData<unknown> | CustomSeriesWhitespaceData<unknown>): data is CustomSeriesWhitespaceData<unknown> {
		return this._paneView.isWhitespace(data);
	}

	protected _fillRawPoints(): void {
		const colorer = this._series.barColorer();
		this._items = this._series
			.conflatedBars()
			.rows()
			.map((row: SeriesPlotRow<'Custom'>) => {
				return {
					time: row.index,
					x: NaN as Coordinate,
					...colorer.barStyle(row.index),
					originalData: row.data,
				};
			});
	}

	protected override _convertToCoordinates(
		priceScale: PriceScale,
		timeScale: ITimeScale
	): void {
		timeScale.indexesToCoordinates(
			this._items,
			undefinedIfNull(this._itemsVisibleRange)
		);
	}

	protected _prepareRendererData(): void {
		this._paneView.update(
			{
				bars: this._items.map(unwrapItemData) as CustomBarItemData<unknown>[],
				barSpacing: this._model.timeScale().barSpacing(),
				visibleRange: this._itemsVisibleRange,
				conflationFactor: this._model.timeScale().conflationFactor(),
			},
			this._series.options()
		);
	}
}

function unwrapItemData(
	item: CustomBarItem
): Record<keyof CustomBarItem, unknown> {
	return {
		x: item.x,
		time: item.time,
		originalData: item.originalData,
		barColor: item.barColor,
	};
}
