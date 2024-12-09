import { DeepPartial, merge } from '../helpers/strict-type-checks';

import { LineData, WhitespaceData } from '../model/data-consumer';
import {
	AreaStyleOptions,
	LineStyleOptions,
	SeriesOptionsCommon,
	SeriesPartialOptionsMap,
	SeriesType,
} from '../model/series-options';
import { lineSeries } from '../model/series/line-series';
import { SeriesDefinition } from '../model/series/series-def';
import { YieldCurveChartOptions, YieldCurveOptions } from '../model/yield-curve-horz-scale-behavior/yield-curve-chart-options';
import { YieldCurveHorzScaleBehavior } from '../model/yield-curve-horz-scale-behavior/yield-curve-horz-scale-behavior';

import { ChartApi } from './chart-api';
import { ISeriesApi } from './iseries-api';
import { IYieldCurveChartApi } from './iyield-chart-api';
import { yieldChartOptionsDefaults } from './options/yield-curve-chart-options-defaults';

interface WhitespaceState {
	start: number;
	end: number;
	resolution: number;
}

function generateWhitespaceData({
	start,
	end,
	resolution,
}: WhitespaceState): WhitespaceData<number>[] {
	return Array.from(
		{ length: Math.floor((end - start) / resolution) + 1 },
		// eslint-disable-next-line quote-props
		(item: unknown, i: number) => ({ 'time': start + i * resolution })
	);
}

function buildWhitespaceState(
	options: YieldCurveOptions,
	lastIndex: number
): WhitespaceState {
	return {
		start: Math.max(0, options.startTimeRange),
		end: Math.max(0, options.minimumTimeRange, lastIndex || 0),
		resolution: Math.max(1, options.baseResolution),
	};
}

const generateWhitespaceHash = ({
	start,
	end,
	resolution,
}: WhitespaceState): string => `${start}~${end}~${resolution}`;

const defaultOptions: DeepPartial<YieldCurveChartOptions> = {
	yieldCurve: yieldChartOptionsDefaults,
	// and add sensible default options for yield charts which
	// are different from the usual defaults.
	timeScale: {
		ignoreWhitespaceIndices: true,
	},
	leftPriceScale: {
		visible: true,
	},
	rightPriceScale: {
		visible: false,
	},
	localization: {
		priceFormatter: (value: number): string => {
			return value.toFixed(3) + '%';
		},
	},
};

const lineStyleDefaultOptionOverrides: DeepPartial<LineStyleOptions & SeriesOptionsCommon & AreaStyleOptions> = {
	lastValueVisible: false,
	priceLineVisible: false,
};

export class YieldChartApi extends ChartApi<number> implements IYieldCurveChartApi {
	public constructor(container: HTMLElement, options?: DeepPartial<YieldCurveChartOptions>) {
		const fullOptions = merge(
			defaultOptions,
			options || {}
		) as YieldCurveChartOptions;
		const horzBehaviour = new YieldCurveHorzScaleBehavior();
		super(container, horzBehaviour, fullOptions);
		horzBehaviour.setOptions(this.options() as YieldCurveChartOptions);
		this._initWhitespaceSeries();
	}

	public override addSeries<T extends SeriesType>(
		definition: SeriesDefinition<T>,
		options: SeriesPartialOptionsMap[T] = {},
		paneIndex: number = 0
	): ISeriesApi<T, number, WhitespaceData<number> | LineData<number>> {
		if (definition.isBuiltIn && ['Area', 'Line'].includes(definition.type) === false) {
			throw new Error('Yield curve only support Area and Line series');
		}
		const optionOverrides = {
			...lineStyleDefaultOptionOverrides,
			...options,
		};
		return super.addSeries(definition, optionOverrides, paneIndex);
	}

	private _initWhitespaceSeries(): void {
		const horzBehaviour = this.horzBehaviour() as YieldCurveHorzScaleBehavior;
		const whiteSpaceSeries = this.addSeries(lineSeries);

		let currentWhitespaceHash: string;
		function updateWhitespace(lastIndex: number): void {
			const newWhitespaceState = buildWhitespaceState(
				horzBehaviour.options().yieldCurve,
				lastIndex
			);
			const newWhitespaceHash = generateWhitespaceHash(newWhitespaceState);

			if (newWhitespaceHash !== currentWhitespaceHash) {
				currentWhitespaceHash = newWhitespaceHash;
				whiteSpaceSeries.setData(generateWhitespaceData(newWhitespaceState));
			}
		}

		updateWhitespace(0);
		horzBehaviour.whitespaceInvalidated().subscribe(updateWhitespace);
	}
}
