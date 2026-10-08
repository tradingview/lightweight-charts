// Resolve the built exports map, as an npm consumer does; no src aliases.
import { createChart, createChartEx, LineStyle, type Coordinate, type IChartApiBase, type MouseEventParams } from 'lightweight-charts';
import {
	createScatterChart,
	createScatterSeries,
	DEFAULT_SCATTER_PALETTE,
	defaultOptions,
	scatterChartDefaults,
	ScatterHorzScaleBehavior,
	type ScatterGroup,
	type ScatterGroupInfo,
	type ScatterPoint,
	type ScatterPointInfo,
	type ScatterSeriesApi,
	type ScatterSeriesOptions,
	type ScatterSeriesPartialOptions,
	type ScatterShape,
	type ScatterSizeLimits,
	type ScatterSizeMapping,
	type ScatterUnderlyingSeries,
	type ScatterXDomain,
} from '@tradingview/lwc-plugin-scatter-series';
import * as scatterPlugin from '@tradingview/lwc-plugin-scatter-series';
import {
	createScatterChart as createChartStandalone,
	createScatterSeries as createSeriesStandalone,
	ScatterHorzScaleBehavior as StandaloneBehavior,
} from '@tradingview/lwc-plugin-scatter-series/standalone';
import { expectTrue, type Equal } from '../../../../tests/plugin-type-checks/assertions.js';

expectTrue<Equal<typeof createScatterChart, typeof createChartStandalone>>();
expectTrue<Equal<typeof createScatterSeries, typeof createSeriesStandalone>>();
expectTrue<Equal<typeof ScatterHorzScaleBehavior, typeof StandaloneBehavior>>();

// The chart has a numeric horizontal scale; chart options pass through.
const chart = createScatterChart(document.createElement('div'), {
	autoSize: true,
	leftPriceScale: { visible: true },
	rightPriceScale: { visible: false },
});
expectTrue<Equal<typeof chart, IChartApiBase<number>>>();

// Without a type argument the points are plain ScatterPoints.
const series = createScatterSeries(chart, {
	color: '#2962FF',
	opacity: 0.65,
	pointSize: 9,
	shape: 'circle',
	groups: [{ id: 'a', name: 'A', shape: 'diamond', lineVisible: true, lineStyle: LineStyle.Dashed }],
	sizeRange: { min: 5, max: 30 },
	sizeScale: 'area',
	xRange: { min: 0, max: null },
	yRange: { min: null, max: 12 },
	xFormatter: (x: number) => `${x}Y`,
	baselines: [{ axis: 'y', value: 0 }, { axis: 'x', value: 5, style: LineStyle.Dashed }],
	plotBorder: { visible: true, left: false },
	priceScaleId: 'left',
	priceFormat: { type: 'custom', formatter: (price: number) => `${price}%`, minMove: 0.01 },
});
expectTrue<Equal<typeof series, ScatterSeriesApi<ScatterPoint>>>();
series.setData([{ x: 1, y: 2 }, { x: 1, y: 3, id: 'b', group: 'a', sizeValue: 4, size: 10, color: 'red', opacity: 1 }]);
expectTrue<Equal<ReturnType<typeof series.options>, Readonly<ScatterSeriesOptions>>>();
expectTrue<Equal<ReturnType<typeof series.series>, ScatterUnderlyingSeries>>();
expectTrue<Equal<ReturnType<typeof series.xDomain>, ScatterXDomain>>();
expectTrue<Equal<ReturnType<typeof series.data>, readonly ScatterPoint[]>>();
expectTrue<Equal<ReturnType<typeof series.options>['groups'], readonly ScatterGroup[]>>();
expectTrue<Equal<ScatterSeriesOptions['shape'], ScatterShape>>();
// The underlying series is a regular series API.
const coordinate: number | null = series.series().priceToCoordinate(1);
series.series().priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } });

// A host's point type round-trips through the data, the hover API and pointById.
interface Bond extends ScatterPoint {
	title: string;
	volume: number;
}
const bonds = createScatterSeries<Bond>(chart, {}, 0);
bonds.setData([{ id: 'x', x: 1, y: 2, title: 'PEMX', volume: 3, sizeValue: 3 }]);
expectTrue<Equal<ReturnType<typeof bonds.data>, readonly Bond[]>>();
expectTrue<Equal<ReturnType<typeof bonds.pointById>, ScatterPointInfo<Bond> | null>>();
expectTrue<Equal<ReturnType<typeof bonds.hitTest>, ScatterPointInfo<Bond> | null>>();
expectTrue<Equal<ReturnType<typeof bonds.hoveredPoint>, ScatterPointInfo<Bond> | null>>();
const bond = bonds.pointById('x');
if (bond !== null) {
	expectTrue<Equal<typeof bond.point, Bond>>();
	const title: string = bond.point.title;
	const where: [number, number, number] = [bond.x, bond.y, bond.radius];
	const groupId: string | null = bond.groupId;
}
const onHovered = (info: ScatterPointInfo<Bond> | null): void => {
	if (info !== null) {
		const volume: number = info.point.volume;
	}
};
bonds.subscribeHoveredPointChange(onHovered);
bonds.unsubscribeHoveredPointChange(onHovered);
bonds.setHoveredPoint('x');
bonds.setHoveredPoint(null);
// @ts-expect-error A host field is required once declared.
bonds.setData([{ x: 1, y: 2, title: 'PEMX' }]);
// @ts-expect-error A host field keeps its declared type.
bonds.setData([{ x: 1, y: 2, title: 'PEMX', volume: '3' }]);
// @ts-expect-error A handler for another point type is rejected.
bonds.subscribeHoveredPointChange((info: ScatterPointInfo<ScatterPoint & { other: boolean }> | null) => info);

// The host tooltip recipe: the chart reports the hovered objectId.
chart.subscribeCrosshairMove((param: MouseEventParams<number>) => {
	const objectId = param.hoveredInfo?.objectId;
	if (typeof objectId === 'string') {
		const info: ScatterPointInfo<Bond> | null = bonds.pointById(objectId);
	}
	const x: number | undefined = param.time;
});

// Options: nested objects are partial, arrays and the formatter are replaced
// whole, and range ends go back to null.
const partial: ScatterSeriesPartialOptions = { plotBorder: { visible: true } };
series.applyOptions(partial);
series.applyOptions({ sizeRange: { max: 30 } });
series.applyOptions({ sizeDomain: { min: 0, max: null } });
series.applyOptions({ yRange: { min: null } });
series.applyOptions({ groups: [{ id: 'x', visible: false }], baselines: [], palette: ['#000000'] });
series.applyOptions({ xFormatter: null });
series.applyOptions({ hitTestTolerance: 0, visible: false });
// @ts-expect-error Unknown options are rejected.
series.applyOptions({ nonexistentOption: true });
// @ts-expect-error The shapes are a closed set.
series.applyOptions({ shape: 'star' });
// @ts-expect-error The size scale is linear or area.
series.applyOptions({ sizeScale: 'log' });
// @ts-expect-error Groups are replaced whole, so each one needs its id.
series.applyOptions({ groups: [{ color: 'red' }] });
// @ts-expect-error A baseline is on the x or the y axis.
series.applyOptions({ baselines: [{ axis: 'z', value: 0 }] });
// @ts-expect-error The X formatter takes a number.
series.applyOptions({ xFormatter: (x: string) => x });
// @ts-expect-error X values are numbers.
series.setData([{ x: '1', y: 2 }]);
// @ts-expect-error A point needs a Y value.
series.setData([{ x: 1 }]);
// @ts-expect-error objectIds are strings.
series.pointById(1);
// @ts-expect-error setHoveredPoint takes an objectId or null.
series.setHoveredPoint(undefined);
// @ts-expect-error A chart with a time scale is not a scatter chart.
createScatterSeries(createChart(document.createElement('div')));

// The legend API: the groups as drawn, and switching them.
expectTrue<Equal<ReturnType<typeof series.groups>, readonly ScatterGroupInfo[]>>();
for (const group of series.groups()) {
	const legendEntry: [string, string, string, ScatterShape, boolean, number] = [
		group.id,
		group.name,
		group.color,
		group.shape,
		group.visible,
		group.pointCount,
	];
	const line: [boolean, string, number, LineStyle] = [group.lineVisible, group.lineColor, group.lineWidth, group.lineStyle];
	const style: [number, number] = [group.opacity, group.pointSize];
	series.setGroupVisible(group.id, !group.visible);
}
// @ts-expect-error The visibility is required.
series.setGroupVisible('a');
// @ts-expect-error Groups are named by id.
series.setGroupVisible(1, true);
// @ts-expect-error The infos are read-only.
series.groups().push(series.groups()[0]);

// The ring defaults to the background (null); the X margins are pixels.
expectTrue<Equal<ScatterSeriesOptions['strokeColor'], string | null>>();
expectTrue<Equal<ScatterSeriesOptions['xMargins'], number>>();
series.applyOptions({ strokeColor: null, xMargins: 12 });
series.applyOptions({ strokeColor: '#131722' });
// @ts-expect-error Margins are numbers of pixels.
series.applyOptions({ xMargins: '12px' });

// The README usage: a typed point carries the host's fields.
interface ReadmeBond extends ScatterPoint {
	title: string;
}
const readme = createScatterSeries<ReadmeBond>(chart, {
	groups: [
		{ id: 'aaa', name: 'AAA-AA', color: '#089981' },
		{ id: 'hy', name: 'High yield', color: '#FF9800' },
	],
	xRange: { min: 0, max: 30 },
	xFormatter: (x: number) => `${x}Y`,
	priceFormat: { type: 'custom', minMove: 0.01, formatter: (y: number) => `${y.toFixed(2)}%` },
});
readme.setData([
	{ id: 'PEMX1', x: 4.5, y: 3.2, group: 'aaa', sizeValue: 120, title: 'PEMX1' },
	{ id: 'PEMX3', x: 21.7, y: 9.4, group: 'hy', sizeValue: 75, title: 'PEMX3' },
]);
readme.subscribeHoveredPointChange((info: ScatterPointInfo<ReadmeBond> | null) => {
	const title: string | undefined = info?.point.title;
});
// @ts-expect-error An untyped series rejects host fields in object literals.
series.setData([{ x: 1, y: 2, title: 'PEMX1' }]);

// Hosts may build the chart themselves with the behaviour. createChartEx
// cannot infer the horizontal item type from the behaviour: pass both.
const custom = createChartEx<number, ScatterHorzScaleBehavior>(
	document.createElement('div'),
	new ScatterHorzScaleBehavior(),
	scatterChartDefaults
);
createScatterSeries(custom).remove();
// The behaviour publishes nothing but IHorzScaleBehavior.
// @ts-expect-error The series' axis state is internal.
custom.horzBehaviour().setScatterXAxis;
// @ts-expect-error So is its formatting helper.
new ScatterHorzScaleBehavior().formatX(1);
const palette: readonly string[] = DEFAULT_SCATTER_PALETTE;
const defaults: ScatterSeriesOptions = defaultOptions;

// Size limits: the defaults are in defaultOptions, the one source of them; every end is a number.
const defaultLimits: ScatterSizeLimits = defaultOptions.pointSizeLimits;
// @ts-expect-error No size constants of their own beside defaultOptions.pointSizeLimits.
scatterPlugin.SCATTER_MIN_POINT_SIZE;
expectTrue<Equal<ScatterSeriesOptions['pointSizeLimits'], ScatterSizeLimits>>();
expectTrue<Equal<ScatterSizeLimits, { min: number; max: number }>>();
series.applyOptions({ pointSizeLimits: { min: 2, max: 3 } });
series.applyOptions({ pointSizeLimits: { max: 120 } });
// @ts-expect-error The limits are numbers, never open.
series.applyOptions({ pointSizeLimits: { min: null } });

// Per-point shape, stroke and hollow markers, also on groups.
series.setData([{ x: 1, y: 2, shape: 'triangleDown', strokeColor: null, strokeWidth: 2, hollow: true }]);
series.setData([{ x: 1, y: 2, strokeColor: '#000000' }]);
series.applyOptions({
	hollow: true,
	groups: [{ id: 'open', hollow: true, strokeColor: null, strokeWidth: 2 }, { id: 'ringed', strokeColor: '#131722' }],
});
expectTrue<Equal<ScatterPoint['shape'], ScatterShape | undefined>>();
expectTrue<Equal<ScatterPoint['strokeColor'], string | null | undefined>>();
expectTrue<Equal<ScatterGroup['hollow'], boolean | undefined>>();
expectTrue<Equal<ScatterSeriesOptions['hollow'], boolean>>();
// @ts-expect-error A point's shape is one of the shapes.
series.setData([{ x: 1, y: 2, shape: 'star' }]);
// @ts-expect-error Hollow is a boolean.
series.setData([{ x: 1, y: 2, hollow: 'yes' }]);
// @ts-expect-error A stroke width is a number of pixels.
series.applyOptions({ groups: [{ id: 'g', strokeWidth: '2px' }] });
// The resolved styles, for a legend and a tooltip.
for (const group of series.groups()) {
	const marker: [boolean, string, number] = [group.hollow, group.strokeColor, group.strokeWidth];
}
const styled = series.pointById('0');
if (styled !== null) {
	const marker: [ScatterShape, boolean, string, number] = [styled.shape, styled.hollow, styled.strokeColor, styled.strokeWidth];
}

// Hover styling.
series.applyOptions({ hoveredSizeIncrease: 4, hoveredRingWidth: 2, hoveredRingGap: 1, hoveredRingColor: null });
series.applyOptions({ hoveredRingColor: 'rgba(41, 98, 255, 0.3)' });
expectTrue<Equal<ScatterSeriesOptions['hoveredRingColor'], string | null>>();
expectTrue<Equal<ScatterSeriesOptions['hoveredSizeIncrease'], number>>();
// @ts-expect-error The ring width is a number.
series.applyOptions({ hoveredRingWidth: true });

// The size mapping, for a bubble-size legend.
expectTrue<Equal<ReturnType<typeof series.sizeMapping>, ScatterSizeMapping | null>>();
const mapping = series.sizeMapping();
if (mapping !== null) {
	const ends: [number, number, number, number] = [mapping.domain.min, mapping.domain.max, mapping.range.min, mapping.range.max];
	const scale: 'linear' | 'area' = mapping.scale;
	const size: number = mapping.sizeFor(42);
	// @ts-expect-error sizeFor takes a number.
	mapping.sizeFor('42');
}

// X coordinates: the X counterparts of priceToCoordinate / coordinateToPrice.
expectTrue<Equal<ReturnType<typeof series.xToCoordinate>, Coordinate | null>>();
expectTrue<Equal<ReturnType<typeof series.xToCoordinate>, ReturnType<ScatterUnderlyingSeries['priceToCoordinate']>>>();
expectTrue<Equal<Parameters<typeof series.xToCoordinate>, [number]>>();
expectTrue<Equal<ReturnType<typeof series.coordinateToX>, number | null>>();
expectTrue<Equal<Parameters<typeof series.coordinateToX>, [number]>>();
expectTrue<Equal<ReturnType<typeof bonds.xToCoordinate>, Coordinate | null>>();
const xCoordinate: number | null = series.xToCoordinate(5);
const xValue: number | null = series.coordinateToX(xCoordinate ?? 0);
// @ts-expect-error X values are numbers.
series.xToCoordinate('5');
// @ts-expect-error A coordinate is a number.
series.coordinateToX(null);
