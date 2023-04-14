import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { undefinedIfNull } from '../../helpers/strict-type-checks';

import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import {
	AbstractBarItemData,
	IAbstractSeriesPaneRenderer,
	IAbstractSeriesPaneView,
	PriceToCoordinateConverter,
} from '../../model/iabstract-series';
import { PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { SeriesPlotRow } from '../../model/series-data';
import { TimedValue } from '../../model/time-data';
import { TimeScale } from '../../model/time-scale';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { SeriesPaneViewBase } from './series-pane-view-base';

type AbstractBarItemBase = TimedValue;

interface AbstractBarItem extends AbstractBarItemBase {
	barColor: string;
	originalData?: Record<string, unknown>;
}

class AbstractSeriesPaneRendererWrapper implements IPaneRenderer {
	private _sourceRenderer: IAbstractSeriesPaneRenderer;
	private _priceScale: PriceToCoordinateConverter;
	public constructor(
		sourceRenderer: IAbstractSeriesPaneRenderer,
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

	// TODO: Add hitTest?
	// public hitTest?(x: Coordinate, y: Coordinate): HoveredObject | null {
	// 	throw new Error('Method not implemented.');
	// }
}

export class SeriesAbstractPaneView extends SeriesPaneViewBase<
	'Abstract',
	AbstractBarItem,
	AbstractSeriesPaneRendererWrapper
> {
	protected readonly _renderer: AbstractSeriesPaneRendererWrapper;
	private readonly _paneView: IAbstractSeriesPaneView;

	public constructor(
		series: Series<'Abstract'>,
		model: ChartModel,
		paneView: IAbstractSeriesPaneView
	) {
		super(series, model, false);
		this._paneView = paneView;
		this._renderer = new AbstractSeriesPaneRendererWrapper(
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

	protected _fillRawPoints(): void {
		const colorer = this._series.barColorer();
		this._items = this._series
			.bars()
			.rows()
			.map((row: SeriesPlotRow<'Abstract'>) => {
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
		timeScale: TimeScale
	): void {
		timeScale.indexesToCoordinates(
			this._items,
			undefinedIfNull(this._itemsVisibleRange)
		);
	}

	protected _prepareRendererData(): void {
		this._paneView.update(
			{
				bars: this._items.map(unwrapItemData) as AbstractBarItemData[],
				barSpacing: this._model.timeScale().barSpacing(),
				visibleRange: this._itemsVisibleRange,
			},
			this._series.options()
		);
	}
}

function unwrapItemData(
	item: AbstractBarItem
): Record<keyof AbstractBarItem, unknown> {
	return {
		x: item.x,
		time: item.time,
		originalData: item.originalData,
		barColor: item.barColor,
	};
}
