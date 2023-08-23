import {
	AreaData,
	BarData,
	BaselineData,
	CandlestickData,
	LineData,
	OhlcData,
	SeriesDataItemTypeMap,
	SingleValueData,
} from '../model/data-consumer';
import { CustomData } from '../model/icustom-series';
import { PlotRow, PlotRowValueIndex } from '../model/plot-data';
import {
	AreaPlotRow,
	BarPlotRow,
	BaselinePlotRow,
	CandlestickPlotRow,
	CustomPlotRow,
	LinePlotRow,
	SeriesPlotRow,
} from '../model/series-data';
import { SeriesType } from '../model/series-options';

type SeriesPlotRowToDataMap<HorzScaleItem> = {
	[T in keyof SeriesDataItemTypeMap]: (plotRow: SeriesPlotRow<T>) => SeriesDataItemTypeMap<HorzScaleItem>[T];
};

function singleValueData<HorzScaleItem>(plotRow: PlotRow): SingleValueData<HorzScaleItem> {
	const data: SingleValueData<HorzScaleItem> = {
		value: plotRow.value[PlotRowValueIndex.Close],
		time: plotRow.originalTime as HorzScaleItem,
	};
	if (plotRow.customValues !== undefined) {
		data.customValues = plotRow.customValues;
	}
	return data;
}

function lineData<HorzScaleItem>(plotRow: LinePlotRow): LineData<HorzScaleItem> {
	const result: LineData<HorzScaleItem> = singleValueData(plotRow);

	if (plotRow.color !== undefined) {
		result.color = plotRow.color;
	}

	return result;
}

function areaData<HorzScaleItem>(plotRow: AreaPlotRow): AreaData<HorzScaleItem> {
	const result: AreaData<HorzScaleItem> = singleValueData(plotRow);

	if (plotRow.lineColor !== undefined) {
		result.lineColor = plotRow.lineColor;
	}

	if (plotRow.topColor !== undefined) {
		result.topColor = plotRow.topColor;
	}

	if (plotRow.bottomColor !== undefined) {
		result.bottomColor = plotRow.bottomColor;
	}

	return result;
}

function baselineData<HorzScaleItem>(plotRow: BaselinePlotRow): BaselineData<HorzScaleItem> {
	const result: BaselineData<HorzScaleItem> = singleValueData(plotRow);

	if (plotRow.topLineColor !== undefined) {
		result.topLineColor = plotRow.topLineColor;
	}

	if (plotRow.bottomLineColor !== undefined) {
		result.bottomLineColor = plotRow.bottomLineColor;
	}

	if (plotRow.topFillColor1 !== undefined) {
		result.topFillColor1 = plotRow.topFillColor1;
	}

	if (plotRow.topFillColor2 !== undefined) {
		result.topFillColor2 = plotRow.topFillColor2;
	}

	if (plotRow.bottomFillColor1 !== undefined) {
		result.bottomFillColor1 = plotRow.bottomFillColor1;
	}

	if (plotRow.bottomFillColor2 !== undefined) {
		result.bottomFillColor2 = plotRow.bottomFillColor2;
	}

	return result;
}

function ohlcData<HorzScaleItem>(plotRow: PlotRow): OhlcData<HorzScaleItem> {
	const data: OhlcData<HorzScaleItem> = {
		open: plotRow.value[PlotRowValueIndex.Open],
		high: plotRow.value[PlotRowValueIndex.High],
		low: plotRow.value[PlotRowValueIndex.Low],
		close: plotRow.value[PlotRowValueIndex.Close],
		time: plotRow.originalTime as HorzScaleItem,
	};
	if (plotRow.customValues !== undefined) {
		data.customValues = plotRow.customValues;
	}
	return data;
}

function barData<HorzScaleItem>(plotRow: BarPlotRow): BarData<HorzScaleItem> {
	const result: BarData<HorzScaleItem> = ohlcData<HorzScaleItem>(plotRow);

	if (plotRow.color !== undefined) {
		result.color = plotRow.color;
	}

	return result;
}

function candlestickData<HorzScaleItem>(plotRow: CandlestickPlotRow): CandlestickData<HorzScaleItem> {
	const result: CandlestickData<HorzScaleItem> = ohlcData(plotRow);
	const { color, borderColor, wickColor } = plotRow;

	if (color !== undefined) {
		result.color = color;
	}

	if (borderColor !== undefined) {
		result.borderColor = borderColor;
	}

	if (wickColor !== undefined) {
		result.wickColor = wickColor;
	}

	return result;
}

export function getSeriesDataCreator<TSeriesType extends SeriesType, HorzScaleItem>(seriesType: TSeriesType): (plotRow: SeriesPlotRow<TSeriesType>) => SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType] {
	const seriesPlotRowToDataMap: SeriesPlotRowToDataMap<HorzScaleItem> = {
		Area: areaData<HorzScaleItem>,
		Line: lineData<HorzScaleItem>,
		Baseline: baselineData<HorzScaleItem>,
		Histogram: lineData<HorzScaleItem>,
		Bar: barData<HorzScaleItem>,
		Candlestick: candlestickData<HorzScaleItem>,
		Custom: customData<HorzScaleItem>,
	};
	return seriesPlotRowToDataMap[seriesType];
}

function customData<HorzScaleItem>(plotRow: CustomPlotRow): CustomData<HorzScaleItem> {
	const time = plotRow.originalTime as HorzScaleItem;
	return {
		...plotRow.data,
		time,
	};
}
