import { DeepPartial, IChartApiBase, LineStyle } from 'lightweight-charts';

import { ScatterChartOptions, createScatterChart } from '../chart';
import type { ScatterGroupInfo, ScatterPoint, ScatterPointInfo } from '../data';
import type { ScatterGroup, ScatterSeriesPartialOptions, ScatterShape } from '../options';
import { ScatterSeriesApi } from '../scatter-series-api';
import { createScatterSeries } from '../scatter-series';
import { SCATTER_MAX_POINT_SIZE, SCATTER_MIN_POINT_SIZE } from '../size';
import { RegionShading } from './region-shading';
import {
	Bond,
	RotationPoint,
	Trade,
	bondMarket,
	largeDataset,
	maeVsPnl,
	sectorRotation,
	seededRandom,
	winLossTrades,
} from './sample-data';

interface DemoEntry {
	chart: IChartApiBase<number>;
	series: ScatterSeriesApi<ScatterPoint>;
}

const demo: Record<string, DemoEntry> = {};
(window as unknown as { demo: typeof demo }).demo = demo;

const app = document.getElementById('app') as HTMLElement;

// The scatter defaults switch the library's scrolling and zooming off. The
// toolbar switches both back on for every chart, to try dragging the plot and
// the axes, wheel and pinch zoom, the way a host that enables them would.
let interactive = false;
// The scatter chart default. With scrolling on, the library keeps the end labels
// of the X axis inside the plot only at a fixed edge; fixed edges also stop
// panning past the X range. Unticking shows the chart without them.
let lockEdges = true;

function applyInteractivity(entry: DemoEntry): void {
	entry.chart.applyOptions({
		handleScroll: interactive,
		handleScale: interactive,
		timeScale: { fixLeftEdge: lockEdges, fixRightEdge: lockEdges },
	});
}

/** Back to the whole X range and an automatic price scale. */
function resetView(entry: DemoEntry): void {
	entry.series.fitXDomain();
	entry.chart.priceScale(entry.series.series().options().priceScaleId ?? 'right').applyOptions({ autoScale: true });
}

function toolbar(): void {
	const bar = document.createElement('div');
	bar.className = 'toolbar';
	const label = document.createElement('label');
	const checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.addEventListener('change', () => {
		interactive = checkbox.checked;
		for (const entry of Object.values(demo)) {
			applyInteractivity(entry);
			if (!interactive) {
				resetView(entry);
			}
		}
	});
	label.append(checkbox, document.createTextNode(' Scroll & zoom'));
	const edgesLabel = document.createElement('label');
	const edges = document.createElement('input');
	edges.type = 'checkbox';
	edges.checked = lockEdges;
	edges.addEventListener('change', () => {
		lockEdges = edges.checked;
		Object.values(demo).forEach(applyInteractivity);
	});
	edgesLabel.append(edges, document.createTextNode(' Keep inside the X range (fixLeftEdge / fixRightEdge)'));
	const reset = document.createElement('button');
	reset.type = 'button';
	reset.textContent = 'Reset all views';
	reset.addEventListener('click', () => Object.values(demo).forEach(resetView));
	const hint = document.createElement('span');
	hint.className = 'hint';
	hint.textContent = 'Drag the plot, or drag the X or Y axis to scale it; the wheel and pinch zoom. ' +
		'Double-click a chart to reset it. While on, the wheel over a chart zooms it instead of scrolling the page.';
	bar.append(label, edgesLabel, reset, hint);
	app.appendChild(bar);
}

toolbar();

// Host-side formatters: the plugin takes plain functions.
const pnlFormatter = (value: number): string =>
	`${(value / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} K`;
const percentFormatter = (value: number): string => `${Number(value.toFixed(2))}%`;
const pnlPriceFormat = { type: 'custom' as const, formatter: pnlFormatter, minMove: 1000 };
const yieldPriceFormat = { type: 'custom' as const, formatter: percentFormatter, minMove: 0.01 };

const chartDefaults: DeepPartial<ScatterChartOptions> = {
	autoSize: true,
	layout: { attributionLogo: false, textColor: '#131722', fontSize: 11 },
	grid: { vertLines: { color: '#E0E3EB' }, horzLines: { color: '#E0E3EB' } },
};

const winLossGroups: ScatterGroup[] = [
	{ id: 'win', name: 'Win trades', color: '#089981' },
	{ id: 'loss', name: 'Loss trades', color: '#F23645' },
];

const bondGroups: ScatterGroup[] = [
	{ id: 'aaa-aa', name: 'AAA-AA', color: '#089981' },
	{ id: 'a-bbb', name: 'A-BBB', color: '#2962FF' },
	{ id: 'high-yield', name: 'High yield', color: '#FF9800' },
];

const zeroBaseline = { axis: 'y' as const, value: 0, color: '#9598A1' };

const rrgGroups: ScatterGroup[] = [
	{ id: 'tech', name: 'Tech', color: '#4CAF50', lineVisible: true, pointSize: 7, lineColor: 'rgba(76, 175, 80, 0.5)' },
	{ id: 'energy', name: 'Energy', color: '#2962FF', lineVisible: true, pointSize: 7, lineColor: 'rgba(41, 98, 255, 0.5)' },
	{ id: 'utilities', name: 'Utilities', color: '#FBC02D', lineVisible: true, pointSize: 7, lineColor: 'rgba(251, 192, 45, 0.6)' },
	{ id: 'health', name: 'Health', color: '#9C27B0', lineVisible: true, pointSize: 7, lineColor: 'rgba(156, 39, 176, 0.5)' },
];

function section(title: string, description: string): HTMLElement {
	const element = document.createElement('section');
	const heading = document.createElement('h2');
	heading.textContent = title;
	const text = document.createElement('p');
	text.textContent = description;
	const grid = document.createElement('div');
	grid.className = 'grid';
	element.append(heading, text, grid);
	app.appendChild(element);
	return grid;
}

interface Card {
	root: HTMLElement;
	controls: HTMLElement;
	chart: HTMLElement;
	legend: HTMLElement;
	readout: HTMLElement;
}

function card(parent: HTMLElement, title: string, description: string, className: string = ''): Card {
	const root = document.createElement('div');
	root.className = `card ${className}`.trim();
	const heading = document.createElement('h3');
	heading.textContent = title;
	const text = document.createElement('div');
	text.className = 'description';
	text.textContent = description;
	const controls = document.createElement('div');
	controls.className = 'controls';
	const chart = document.createElement('div');
	chart.className = 'chart';
	const legend = document.createElement('div');
	legend.className = 'legend';
	const readout = document.createElement('div');
	readout.className = 'readout';
	readout.textContent = 'hovered: –';
	root.append(heading, text, controls, chart, legend, readout);
	parent.appendChild(root);
	return { root, controls, chart, legend, readout };
}

/** A readout number: at most `decimals` decimals, trailing zeros dropped, grouped thousands. */
function round(value: number, decimals: number = 2): string {
	return value.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

function describe(info: ScatterPointInfo<ScatterPoint> | null): string {
	if (info === null) {
		return 'hovered: –';
	}
	const title = (info.point as Partial<Trade>).title ?? info.objectId;
	return `hovered: ${title} · x ${round(info.point.x)} · y ${round(info.point.y)}` +
		` · at (${round(info.x, 0)}, ${round(info.y, 0)}) r ${round(info.radius, 1)}`;
}

function mount<TPoint extends ScatterPoint>(
	name: string,
	target: Card,
	points: TPoint[],
	seriesOptions: ScatterSeriesPartialOptions,
	chartOptions: DeepPartial<ScatterChartOptions> = {}
): ScatterSeriesApi<TPoint> {
	const chart = createScatterChart(target.chart, { ...chartDefaults, ...chartOptions });
	const series = createScatterSeries<TPoint>(chart, seriesOptions);
	series.setData(points);
	series.subscribeHoveredPointChange((info: ScatterPointInfo<TPoint> | null) => {
		target.readout.textContent = describe(info as ScatterPointInfo<ScatterPoint> | null);
	});
	const entry: DemoEntry = { chart, series: series as unknown as ScatterSeriesApi<ScatterPoint> };
	demo[name] = entry;
	applyInteractivity(entry);
	// Runs after the library's own double-click reset of an axis, which knows
	// nothing of the X domain.
	target.chart.addEventListener('dblclick', () => resetView(entry));
	return series;
}

/**
 * A host-like legend, built from the groups as the series draws them: their
 * resolved colour and shape, palette entries included. A click shows or hides
 * the group: the X axis stays put, the price scale fits the visible points.
 */
function legend<TPoint extends ScatterPoint>(target: Card, series: ScatterSeriesApi<TPoint>): void {
	const render = (): void => {
		target.legend.replaceChildren();
		for (const group of series.groups()) {
			target.legend.appendChild(legendItem(group, () => {
				series.setGroupVisible(group.id, !group.visible);
				render();
			}));
		}
	};
	render();
}

function legendItem(group: ScatterGroupInfo, toggle: () => void): HTMLElement {
	const button = document.createElement('button');
	button.type = 'button';
	button.classList.toggle('off', !group.visible);
	button.setAttribute('aria-pressed', String(group.visible));
	button.title = `${group.pointCount} points. Click to ${group.visible ? 'hide' : 'show'}.`;
	const marker = document.createElement('span');
	marker.className = `marker ${group.shape}${group.hollow ? ' hollow' : ''}`;
	if (group.hollow) {
		// An open marker: its outline, in the colour and width the series resolved.
		marker.style.border = `${Math.min(2, group.strokeWidth)}px solid ${group.strokeColor}`;
	} else {
		marker.style.background = group.color;
	}
	button.append(marker, document.createTextNode(group.name));
	button.addEventListener('click', toggle);
	return button;
}

/**
 * A size input limited to what the plugin draws with the default
 * `pointSizeLimits`: 5–50 px. A value typed outside is clamped when the input
 * is committed, so the field always shows the size in use.
 */
function sizeInput(label: string, value: number, onChange: (value: number) => void): HTMLElement {
	const wrapper = document.createElement('label');
	const input = document.createElement('input');
	input.type = 'number';
	input.min = String(SCATTER_MIN_POINT_SIZE);
	input.max = String(SCATTER_MAX_POINT_SIZE);
	input.step = '1';
	input.value = String(value);
	const clamped = (): number | null => {
		const raw = input.valueAsNumber;
		return Number.isFinite(raw)
			? Math.min(SCATTER_MAX_POINT_SIZE, Math.max(SCATTER_MIN_POINT_SIZE, Math.round(raw)))
			: null;
	};
	let current = value;
	input.addEventListener('input', () => {
		const next = clamped();
		if (next !== null && next !== current) {
			current = next;
			onChange(next);
		}
	});
	input.addEventListener('change', () => {
		input.value = String(clamped() ?? current);
		input.dispatchEvent(new Event('input'));
	});
	wrapper.append(document.createTextNode(`${label} `), input);
	return wrapper;
}

function select(label: string, values: readonly string[], onChange: (value: string) => void): HTMLElement {
	const wrapper = document.createElement('label');
	const element = document.createElement('select');
	for (const value of values) {
		const option = document.createElement('option');
		option.value = value;
		option.textContent = value;
		element.appendChild(option);
	}
	element.addEventListener('change', () => onChange(element.value));
	wrapper.append(document.createTextNode(`${label} `), element);
	return wrapper;
}

/**
 * A host-side bubble-size legend under a chart, built from the series' size
 * mapping: three sample bubbles, the smallest, a middle and the largest
 * value, drawn at the very sizes the series draws them.
 */
function bubbleLegend<TPoint extends ScatterPoint>(
	target: Card,
	series: ScatterSeriesApi<TPoint>,
	caption: string,
	format: (value: number) => string
): () => void {
	const element = document.createElement('div');
	element.className = 'bubble-legend';
	target.legend.after(element);
	const render = (): void => {
		element.replaceChildren();
		const mapping = series.sizeMapping();
		if (mapping === null) {
			return;
		}
		const { min, max } = mapping.domain;
		const label = document.createElement('span');
		label.className = 'caption';
		label.textContent = caption;
		element.appendChild(label);
		for (const value of [min, (min + max) / 2, max]) {
			const size = mapping.sizeFor(value);
			const item = document.createElement('span');
			item.className = 'item';
			const bubble = document.createElement('span');
			bubble.className = 'bubble';
			bubble.style.width = `${size}px`;
			bubble.style.height = `${size}px`;
			item.append(bubble, document.createTextNode(format(value)));
			element.appendChild(item);
		}
	};
	render();
	return render;
}

const pnlChart = { rightPriceScale: { scaleMargins: { top: 0.04, bottom: 0.04 } } };
// A pinned Y range puts its ends on the plot edges. The price axis centres
// its labels on their values and does not move the edge ones inside, so leave
// a few pixels of room for them.
const pinnedChart = { rightPriceScale: { scaleMargins: { top: 0.03, bottom: 0.03 } } };

// --- Colours and sizes -------------------------------------------------------
{
	const grid = section(
		'Colours and sizes',
		'The author sets colour, opacity and size. Default: tv-blue/500, opacity 0.65, 9 px including the stroke. Sizes are clamped to 5–50 px.'
	);
	const trades = maeVsPnl(1);
	const plain = trades.map(({ sizeValue, ...rest }: Trade) => rest);
	mount('default', card(grid, 'MAE vs PnL', 'Default size and colour'), plain, {
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, pnlChart);
	mount('yellow', card(grid, 'MAE vs PnL', 'color: banana-yellow/700, opacity: 0.5, size: 23px with stroke'), plain, {
		color: '#FBC02D',
		opacity: 0.5,
		pointSize: 23,
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, pnlChart);
	mount('red', card(grid, 'MAE vs PnL', 'color: red-ripe/a400, opacity: 1.0, size: 5px with stroke'), plain, {
		color: '#FF3333',
		opacity: 1,
		pointSize: 5,
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, pnlChart);
	mount('sky', card(grid, 'MAE vs PnL', 'color: sky-blue/400, opacity: 0.2, size: 50px with stroke'), plain, {
		color: '#26C6DA',
		opacity: 0.2,
		pointSize: 50,
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, pnlChart);
}

// --- Dynamic size ------------------------------------------------------------
{
	const grid = section(
		'Dynamic size',
		'A data value drives the size through a size range: 5–25 px by default, each end within 5–50 px.'
	);
	mount('duration', card(grid, 'MAE vs PnL', 'Here the size of a point is the time the position was held'), maeVsPnl(1), {
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, pnlChart);
	const bonds = card(grid, 'Bond market map', 'Yield curve vs maturity, bubble size = issue volume (size 5–30 px)');
	const bondSeries = mount('bondSizes', bonds, bondMarket(3, 16), {
		groups: bondGroups,
		sizeRange: { min: 5, max: 30 },
		sizeScale: 'area',
		xRange: { min: 0, max: 30 },
		yRange: { min: 0, max: 12 },
		xFormatter: (x: number) => `${x}Y`,
		baselines: [zeroBaseline],
		priceFormat: yieldPriceFormat,
	}, pinnedChart);
	legend(bonds, bondSeries);
	// The bubble-size legend: what a host builds from sizeMapping().
	bubbleLegend(bonds, bondSeries, 'Issue volume', (value: number) => `${round(value, 1)}B`);
	mount('range5to50', card(grid, 'MAE vs PnL', 'Size range: 5–50 px'), maeVsPnl(1), {
		sizeRange: { min: 5, max: 50 },
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, pnlChart);
	mount('range10to20', card(grid, 'MAE vs PnL', 'Size range: 10–20 px'), maeVsPnl(1), {
		sizeRange: { min: 10, max: 20 },
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, pnlChart);
}

// --- Per-point overrides -----------------------------------------------------
{
	const grid = section(
		'Per-point overrides',
		'Any point can override its colour, opacity and size; the override beats the group. Hover a row to highlight its bond from outside the chart.'
	);
	const bonds = bondMarket(3, 18);
	const highlighted = bonds.find((bond: Bond) => bond.group === 'aaa-aa' && bond.x > 11 && bond.x < 14) ?? bonds[0];
	const data = bonds.map((bond: Bond) => (bond === highlighted ? { ...bond, color: '#F23645', opacity: 1, size: 22 } : bond));
	const target = card(grid, 'Bond market map', 'Yield curve vs maturity, bubble size = issue volume (size 5–30 px)', 'wide');
	const series = mount('override', target, data, {
		groups: bondGroups,
		sizeRange: { min: 5, max: 30 },
		sizeScale: 'area',
		xRange: { min: 0, max: 30 },
		yRange: { min: 0, max: 12 },
		xFormatter: (x: number) => `${x}Y`,
		baselines: [zeroBaseline],
		priceFormat: yieldPriceFormat,
	}, pinnedChart);
	legend(target, series);
	// A host-side table: hovering a row highlights the bond through the API.
	const rows = document.createElement('div');
	rows.className = 'rows';
	const largest = [...data].sort((a: Bond, b: Bond) => b.volume - a.volume).slice(0, 8);
	for (const bond of largest) {
		const row = document.createElement('span');
		row.textContent = `${bond.title} · ${bond.volume}B`;
		row.addEventListener('mouseenter', () => series.setHoveredPoint(bond.id ?? null));
		row.addEventListener('mouseleave', () => series.setHoveredPoint(null));
		rows.appendChild(row);
	}
	target.root.appendChild(rows);
}

// --- Groups ------------------------------------------------------------------
{
	const grid = section(
		'Data series (groups)',
		'A group is a named set of points sharing colour and marker shape. Up to 10 groups and 5000 points per widget.'
	);
	const bonds = card(grid, 'Bond market map', 'Yield curve vs maturity, bubble size = issue volume');
	const bondSeries = mount('bonds', bonds, bondMarket(3, 16).map(({ sizeValue, ...rest }: Bond) => rest), {
		groups: bondGroups,
		pointSize: 8,
		xRange: { min: 0, max: 30 },
		yRange: { min: 0, max: 12 },
		xFormatter: (x: number) => `${x}Y`,
		baselines: [zeroBaseline],
		priceFormat: yieldPriceFormat,
	}, pinnedChart);
	legend(bonds, bondSeries);

	const rrg = card(grid, 'Sector rotation (RRG)', 'Relative strength vs momentum, 10-week tails, line width 1');
	const rrgSeries = mount<RotationPoint>('rrg', rrg, sectorRotation(5), {
		groups: rrgGroups,
		xRange: { min: 96, max: 104 },
		yRange: { min: 96, max: 104 },
		baselines: [{ axis: 'y', value: 100, color: '#9598A1' }],
		priceFormat: { type: 'price', precision: 0, minMove: 1 },
	}, pinnedChart);
	legend(rrg, rrgSeries);

	const shapes: ScatterShape[] = ['circle', 'square', 'diamond', 'triangleUp', 'triangleDown'];
	const random = seededRandom(21);
	const shapePoints: ScatterPoint[] = [];
	shapes.forEach((shape: ScatterShape, index: number) => {
		for (let i = 0; i < 14; i++) {
			shapePoints.push({ group: shape, x: random() * 10, y: index * 2 + random() * 1.6, sizeValue: random() });
		}
	});
	const shapeGroups: ScatterGroup[] = shapes.map((shape: ScatterShape) => ({ id: shape, shape }));
	const shapesCard = card(grid, 'Marker shapes', 'Shape is a group style; colours come from the default palette');
	const shapeSeries = mount('shapes', shapesCard, shapePoints, {
		groups: shapeGroups,
		sizeRange: { min: 8, max: 22 },
		priceFormat: { type: 'price', precision: 1, minMove: 0.1 },
	});
	legend(shapesCard, shapeSeries);

	const many = card(grid, 'Limits', '10 groups × 500 points = 5000 points, sized by value');
	mount('large', many, largeDataset(11), { sizeRange: { min: 5, max: 12 }, opacity: 0.5 });
}

// --- Baselines and borders ---------------------------------------------------
{
	const grid = section(
		'Baselines and borders',
		'Baselines on the X axis, on the Y axis, on both, or accent borders around the whole plot.'
	);
	const trades = maeVsPnl(2);
	const common = { priceFormat: pnlPriceFormat, sizeRange: { min: 5, max: 20 } };
	mount('baselineY', card(grid, 'MAE vs PnL', 'Y baseline: a horizontal line at PnL = 0'), trades, {
		...common,
		baselines: [zeroBaseline],
	}, pnlChart);
	mount('baselineX', card(grid, 'MAE vs PnL', 'X baseline: a vertical line at MAE = 45'), trades, {
		...common,
		baselines: [{ axis: 'x', value: 45, color: '#9598A1' }],
	}, pnlChart);
	mount('baselineBoth', card(grid, 'MAE vs PnL', 'Both baselines, the X one dashed'), trades, {
		...common,
		baselines: [zeroBaseline, { axis: 'x', value: 45, color: '#9598A1', style: LineStyle.Dashed }],
	}, pnlChart);
	mount('border', card(grid, 'MAE vs PnL', 'Accent borders around the plot'), trades, {
		...common,
		plotBorder: { visible: true, color: '#9598A1', width: 1 },
	}, pnlChart);
}

// --- Grid, display and size --------------------------------------------------
{
	const grid = section(
		'Grid, display and size',
		'The Y scale can be on the right or on the left. The chart fills the available width, down to 300 px; the labels thin out.'
	);
	const trades = maeVsPnl(4);
	mount('right', card(grid, 'MAE vs PnL', 'Y axis on the right'), trades, {
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, pnlChart);
	mount('left', card(grid, 'MAE vs PnL', 'Y axis on the left'), trades, {
		priceScaleId: 'left',
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, {
		leftPriceScale: { visible: true, scaleMargins: { top: 0.04, bottom: 0.04 } },
		rightPriceScale: { visible: false },
	});

	const winLoss = card(
		grid,
		'MAE vs PnL',
		'Each dot is a closed trade: max adverse excursion vs final result. Click a legend entry: the X axis stays, the price scale follows.',
		'wide'
	);
	const winLossSeries = mount('winLoss', winLoss, winLossTrades(7), {
		groups: winLossGroups,
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, pnlChart);
	legend(winLoss, winLossSeries);

	const narrow = card(grid, 'MAE vs PnL', 'Each dot is a closed trade: max adverse excursion vs final result', 'narrow');
	const narrowSeries = mount('narrow', narrow, winLossTrades(7), {
		groups: winLossGroups,
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, pnlChart);
	legend(narrow, narrowSeries);

	const sized = card(grid, 'MAE vs PnL', 'The user overrides the size range in the settings');
	const sizedSeries = mount('sizeControl', sized, winLossTrades(7), {
		groups: winLossGroups,
		sizeRange: { min: 5, max: 24 },
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, pnlChart);
	legend(sized, sizedSeries);
	let range = { min: 5, max: 24 };
	// The sizes in use: each end clamped to the default size limits, 5–50 px, the smaller one first.
	const effective = document.createElement('span');
	const apply = (next: { min: number; max: number }): void => {
		range = next;
		sizedSeries.applyOptions({ sizeRange: range });
		effective.textContent = `→ ${Math.min(range.min, range.max)}–${Math.max(range.min, range.max)} px`;
	};
	apply(range);
	sized.controls.append(
		document.createTextNode('Dots size'),
		sizeInput('min', range.min, (value: number) => apply({ ...range, min: value })),
		sizeInput('max', range.max, (value: number) => apply({ ...range, max: value })),
		effective,
		select('scale', ['linear', 'area'], (value: string) => {
			sizedSeries.applyOptions({ sizeScale: value as 'linear' | 'area' });
		})
	);
}

// --- Beyond the design ---------------------------------------------------------
{
	const grid = section(
		'Beyond the design',
		'Options for scatter plots in general, all off by default: other size limits, per-point shapes, open and ringed markers, hover styling — and an overlay drawn by the page itself.'
	);

	const dense = card(grid, 'Dense plot', '20 000 points of 2–3 px: pointSizeLimits 2–3, sized by value. The ring narrows to a quarter of the size, so every dot keeps its colour.');
	const denseSeries = mount('dense', dense, largeDataset(13, 4, 5000), {
		pointSizeLimits: { min: 2, max: 3 },
		sizeRange: { min: 2, max: 3 },
		opacity: 0.8,
		priceFormat: { type: 'price', precision: 0, minMove: 1 },
	});
	legend(dense, denseSeries);

	// Colour by result (the group), shape by side (each point).
	const sides = seededRandom(17);
	const trades = winLossTrades(7).map((trade: Trade) => ({ ...trade, shape: (sides() < 0.5 ? 'triangleUp' : 'triangleDown') as ScatterShape }));
	const shaped = card(grid, 'MAE vs PnL', 'Per-point shapes: the group sets the colour, each trade its shape — ▲ long, ▼ short.');
	const shapedSeries = mount('perPointShapes', shaped, trades, {
		groups: winLossGroups,
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, pnlChart);
	legend(shaped, shapedSeries);

	const openGroups: ScatterGroup[] = [
		{ id: 'aaa-aa', name: 'AAA-AA', color: '#089981', hollow: true, strokeWidth: 2 },
		{ id: 'a-bbb', name: 'A-BBB', color: '#2962FF', strokeColor: '#131722', strokeWidth: 2 },
		{ id: 'high-yield', name: 'High yield', color: '#FF9800' },
	];
	const openBonds = bondMarket(3, 16).map((bond: Bond, index: number) => (index === 5 ? { ...bond, hollow: false, size: 16 } : bond));
	const open = card(grid, 'Bond market map', 'Open and ringed markers, sized by issue volume: a hollow group, a group with a dark 2 px ring, and one filled point of the hollow group.');
	const openSeries = mount('hollow', open, openBonds, {
		groups: openGroups,
		pointSize: 10,
		opacity: 0.9,
		xRange: { min: 0, max: 30 },
		yRange: { min: 0, max: 12 },
		xFormatter: (x: number) => `${x}Y`,
		baselines: [zeroBaseline],
		priceFormat: yieldPriceFormat,
	}, pinnedChart);
	legend(open, openSeries);

	const hover = card(grid, 'MAE vs PnL', 'Hover styling: the hovered point grows by 4 px and gets a 2 px ring, 2 px away. The readout reports the grown radius.');
	mount('hoverStyling', hover, maeVsPnl(3), {
		hoveredSizeIncrease: 4,
		hoveredRingWidth: 2,
		hoveredRingGap: 2,
		baselines: [zeroBaseline],
		priceFormat: pnlPriceFormat,
	}, pnlChart);

	// The page's own overlay, from the README recipe: a series primitive placed
	// with xToCoordinate and priceToCoordinate, under the grid and the tails.
	const quadrants = card(grid, 'Sector rotation (RRG)', 'Quadrants drawn by the page: a series primitive placed with xToCoordinate and priceToCoordinate shades Leading, Weakening, Lagging and Improving. It follows zoom and resizes.');
	const quadrantSeries = mount<RotationPoint>('rrgQuadrants', quadrants, sectorRotation(5), {
		groups: rrgGroups,
		xRange: { min: 96, max: 104 },
		yRange: { min: 96, max: 104 },
		baselines: [{ axis: 'y', value: 100, color: '#9598A1' }, { axis: 'x', value: 100, color: '#9598A1' }],
		priceFormat: { type: 'price', precision: 0, minMove: 1 },
	}, pinnedChart);
	quadrantSeries.series().attachPrimitive(new RegionShading(quadrantSeries, [
		{ xMin: 100, xMax: null, yMin: 100, yMax: null, color: 'rgba(8, 153, 129, 0.1)' }, // Leading
		{ xMin: 100, xMax: null, yMin: null, yMax: 100, color: 'rgba(251, 192, 45, 0.12)' }, // Weakening
		{ xMin: null, xMax: 100, yMin: null, yMax: 100, color: 'rgba(242, 54, 69, 0.08)' }, // Lagging
		{ xMin: null, xMax: 100, yMin: 100, yMax: null, color: 'rgba(41, 98, 255, 0.08)' }, // Improving
	]));
	legend(quadrants, quadrantSeries);
}
