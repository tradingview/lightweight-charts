import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { CustomData, WhitespaceData } from '../../api/data-consumer';

import { undefinedIfNull } from '../../helpers/strict-type-checks';

import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import {
	CustomBarItemData,
	CustomSeriesPricePlotValues,
	ICustomSeriesPaneRenderer,
	ICustomSeriesPaneView,
	PriceToCoordinateConverter,
} from '../../model/icustom-series';
import { PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { SeriesPlotRow } from '../../model/series-data';
import { TimedValue } from '../../model/time-data';
import { TimeScale } from '../../model/time-scale';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

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

	// TODO: Add hitTest?
	// public hitTest?(x: Coordinate, y: Coordinate): HoveredObject | null {
	// 	throw new Error('Method not implemented.');
	// }
}

export class SeriesCustomPaneView extends SeriesPaneViewBase<
	'Custom',
	CustomBarItem,
	CustomSeriesPaneRendererWrapper
> {
	protected readonly _renderer: CustomSeriesPaneRendererWrapper;
	private readonly _paneView: ICustomSeriesPaneView;

	public constructor(
		series: Series<'Custom'>,
		model: ChartModel,
		paneView: ICustomSeriesPaneView
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

	public priceValueBuilder(plotRow: CustomData | WhitespaceData): CustomSeriesPricePlotValues {
		return this._paneView.priceValueBuilder(plotRow);
	}

	public isWhitespace(data: CustomData | WhitespaceData): data is WhitespaceData {
		return this._paneView.isWhitespace(data);
	}

	protected _fillRawPoints(): void {
		const colorer = this._series.barColorer();
		this._items = this._series
			.bars()
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
				bars: this._items.map(unwrapItemData) as CustomBarItemData[],
				barSpacing: this._model.timeScale().barSpacing(),
				visibleRange: this._itemsVisibleRange,
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
