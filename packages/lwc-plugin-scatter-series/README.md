# Scatter series

A scatter and bubble chart for Lightweight Charts™: points placed by two
numbers on a numeric X axis, in named groups with their own colours and marker
shapes, sized by a data value, optionally connected by lines, with baselines
and accent borders around the plot.

Use it to show how two measures relate across many items, where time is not
the horizontal axis: trades by maximum adverse excursion and result, bonds by
maturity and yield with the issue size as the bubble, or sectors on a relative
rotation graph with their recent path as a tail. The plugin draws the chart
content only: titles, legends and tooltips stay with your page, and the series
tells it which point is hovered and where it is drawn.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.2.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-scatter-series
```

Then create a scatter chart and add the series to it:

```js
import { createScatterChart, createScatterSeries } from '@tradingview/lwc-plugin-scatter-series';

const chart = createScatterChart(document.getElementById('container'), { autoSize: true });
const series = createScatterSeries(chart, {
    groups: [
        { id: 'win', name: 'Win trades', color: '#089981' },
        { id: 'loss', name: 'Loss trades', color: '#F23645' },
    ],
    baselines: [{ axis: 'y', value: 0 }],
});

series.setData([
    { x: 12, y: 540000, group: 'win', sizeValue: 14 },
    { x: 31, y: -320000, group: 'loss', sizeValue: 3 },
    { x: 18, y: 120000, group: 'win', sizeValue: 40 },
]);
```

### CDN

The plugin is published as ES modules. Map the library and the plugin to their
CDN builds with an import map:

```html
<script type="importmap">
{
  "imports": {
    "lightweight-charts": "https://unpkg.com/lightweight-charts@^5/dist/lightweight-charts.standalone.production.mjs",
    "@tradingview/lwc-plugin-scatter-series": "https://unpkg.com/@tradingview/lwc-plugin-scatter-series/dist/scatter-series.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createScatterChart, createScatterSeries } from '@tradingview/lwc-plugin-scatter-series';

const series = createScatterSeries(createScatterChart(document.getElementById('container'), { autoSize: true }));
series.setData([{ x: 1, y: 2 }, { x: 3, y: 5 }, { x: 4, y: 1 }]);
</script>
```

## Usage

`createScatterChart(container, options?)` creates a chart whose horizontal
scale is a numeric X axis (see [The scatter chart](#the-scatter-chart)), and
`createScatterSeries(chart, options?, paneIndex?)` adds the series, which
holds the whole dataset, every group included. Fields of your own travel with
the points; give the series their type:

```ts
import { createScatterChart, createScatterSeries, type ScatterPoint } from '@tradingview/lwc-plugin-scatter-series';

interface Bond extends ScatterPoint {
    title: string;
}

const chart = createScatterChart(document.getElementById('container')!, { autoSize: true });
const series = createScatterSeries<Bond>(chart, {
    groups: [
        { id: 'aaa', name: 'AAA-AA', color: '#089981' },
        { id: 'hy', name: 'High yield', color: '#FF9800' },
    ],
    xRange: { min: 0, max: 30 },
    xFormatter: (x: number) => `${x}Y`,
    priceFormat: { type: 'custom', minMove: 0.01, formatter: (y: number) => `${y.toFixed(2)}%` },
});

series.setData([
    { id: 'PEMX1', x: 4.5, y: 3.2, group: 'aaa', sizeValue: 120, title: 'PEMX1' },
    { id: 'PEMX3', x: 21.7, y: 9.4, group: 'hy', sizeValue: 75, title: 'PEMX3' },
]);
```

Change options with `series.applyOptions({ ... })` and replace the points with
`series.setData(points)`; the chart applies both on its next frame. Every
option and method is documented in the package's type declarations.

### Points

| Field | Type | Description |
| --- | --- | --- |
| `x`, `y` | `number` | Position, in X axis and price scale units. Required. A point is drawn only when both are finite and `x` is within the X range. |
| `id` | `string` | Reported as the `objectId` when the point is hovered; defaults to its index. Keep it unique. |
| `group` | `string` | Identifier of the point's group. |
| `sizeValue` | `number` | A value mapped to the point's size (see [Dynamic size](#dynamic-size)). |
| `size` | `number` | Size in CSS pixels, stroke included. Overrides `sizeValue`. |
| `color`, `opacity`, `shape`, `strokeColor`, `strokeWidth`, `hollow` | | Overrides of the group's style (see [Point styles](#point-styles)). |

Points need no ordering, and may share an X value. Any other field is kept
and handed back with the point by the hover API.

### Groups

A group is a named set of points sharing a style — what a user calls a
"series" of the scatter chart. Declare groups in `groups`, in drawing order; a
group a point names without it being declared comes after them. `groups` is
replaced as a whole by `applyOptions`.

| Field | Default | Description |
| --- | --- | --- |
| `id` | — | Identifier points refer to. Required. |
| `name` | `id` | Display name, for your legend. |
| `color` | the `palette` entry | Fill colour. |
| `opacity`, `shape`, `pointSize`, `strokeColor`, `strokeWidth`, `hollow` | the series option | Style of the group's points; `opacity` is `1` with `lineVisible`. |
| `visible` | `true` | Whether the group is drawn, hovered and autoscaled. |
| `lineVisible` | `false` | Connect the group's points in data order, as a tail. |
| `lineWidth`, `lineColor`, `lineStyle` | `1`, the group colour, solid | The connecting line. |

A hidden group still counts for the automatic X range and size domain, so
switching it moves neither; `series.setGroupVisible(id, visible)` switches one
without passing every group again. A connecting line is cut at the plot edge.

### Point styles

A point's style beats its group's, which beats the series options; its size
is its `size`, else its mapped `sizeValue`, else the `pointSize` of its group,
else of the series. Every point has a thin ring, `strokeWidth` wide but at
most a quarter of its size, to show where points overlap; a `hollow` point is
an outline at least 1 px wide and no fill. The ring colour is automatic by
default: the chart's background, following theme changes, or the point's own
colour when it is hollow.

`strokeColor` is the only style that also takes `null`, on a group or a point,
and `null` is not the same as leaving it out: left out, the colour comes from
the group, then the series; `null` asks for the automatic colour even when the
group or the series sets one.

```js
series.applyOptions({
    strokeColor: '#131722',
    groups: [
        { id: 'aaa', hollow: true, strokeWidth: 2, strokeColor: null }, // outlined in its own colour
        { id: 'bbb', strokeWidth: 2 }, // ringed in #131722
    ],
});
```

### Dynamic size

`sizeValue` is mapped onto `sizeRange` (5–25 px by default): `sizeDomain.min`
to the smallest size, `sizeDomain.max` to the largest, and values beyond the
domain to its ends. An open end of the domain (`null`, the default) is taken
from the points of every group, hidden ones included. When every value is the
same, the points are drawn at the middle of the range. When every value lies
past the one given end, the domain is that end alone and the points take its
size: the smallest below a given `min`, the largest above a given `max`.
`sizeScale: 'area'` grows the area
rather than the diameter, which is what the eye compares in a bubble chart.

```js
series.applyOptions({ sizeRange: { min: 5, max: 50 }, sizeDomain: { min: 0, max: null }, sizeScale: 'area' });
```

Every size, stroke included, is clamped to `pointSizeLimits`: 5–50 px by
default (`defaultOptions.pointSizeLimits`), each end within 1–500 px.
`series.sizeMapping()` returns the mapping as drawn — `domain`, `range`,
`scale` and `sizeFor(value)` — for a bubble-size legend.

### Baselines and border

`baselines` are reference lines under the points: `{ axis: 'y', value: 0 }`
is horizontal at a Y value, `axis: 'x'` vertical at an X value, each with an
optional `color`, `width` and `style`. The price scale and the automatic X
range include them. `plotBorder` draws an accent border inside the edges of
the plot, on the sides you choose: `{ visible: true, top: false, right: false }`.

### The X axis

The X axis spans `xRange`. An open end (`null`, the default) is taken from
every point and rounded outwards to a nice tick — 1, 2 or 5 × 10ⁿ, about ten
intervals across; a given end off the axis grid (slots a tenth or a twentieth
of a tick apart) is moved outwards to it. `series.xDomain()` returns the range
in use. The labels are evenly spaced nice values, thinned out on narrow charts
so that none overlap, and formatted with `xFormatter`.

The ends of the range sit on the plot edges, so a bubble there is cut in half;
`xMargins` keeps room for it, in pixels. A fixed edge allows no such room, so
while `xMargins` is above 0 the series frees the chart's fixed edges, and fixes
them again when the margins return to 0 or the series is removed. For dates,
pass timestamps and format them: the ticks are nice numbers of the unit, not
calendar boundaries, and next to large offsets such as epoch milliseconds the
slots stay coarse enough to be distinct numbers. X values beyond ±1e300 cannot
be laid out: those points are not drawn, and the series warns once.

```js
series.applyOptions({
    xFormatter: x => new Date(x).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
    xMargins: 12,
});
series.setData(trades.map(trade => ({ id: trade.id, x: trade.closedAt, y: trade.pnl }))); // epoch milliseconds
```

### The Y axis

The Y axis is the series' price scale: format it with `priceFormat`, and pin
either end with `yRange` (an open end autoscales, with room for the largest
point; ends in the wrong order are swapped, as in `xRange`). Its modes apply as they are — `PriceScaleMode.Logarithmic`, or
`invertScale` — and the points, hit tests and `pointById` follow; the
percentage and indexed-to-100 modes mean nothing here, and the series warns
once when either is set. For the scale on the left, give the chart
`leftPriceScale: { visible: true }` and `rightPriceScale: { visible: false }`,
and the series `priceScaleId: 'left'`.

## The scatter chart

`createScatterChart` is `createChartEx` with a numeric horizontal scale
behaviour (`ScatterHorzScaleBehavior`) and these defaults
(`scatterChartDefaults`), which the options you pass override:

- scrolling and zooming off, flag by flag: `handleScroll`'s `mouseWheel`,
  `pressedMouseMove`, `horzTouchDrag` and `vertTouchDrag`, and `handleScale`'s
  `mouseWheel`, `pinch`, and `axisPressedMouseMove` and `axisDoubleClickReset`
  for both axes, so that the X axis spans its range edge to edge;
- `crosshair.mode: CrosshairMode.Hidden`; hover and the crosshair events keep
  working;
- dotted grid lines, and no time or price scale borders;
- on the time scale: `allowBoldLabels: false`, `uniformDistribution: true`,
  `lockVisibleTimeRangeOnResize: true`, `shiftVisibleRangeOnNewBar: false`,
  `rightOffset: 0`, `minBarSpacing: 0.001`, `fixLeftEdge: true` and
  `fixRightEdge: true`;
- price `scaleMargins` of 0.05 at the top and the bottom, on both price
  scales; the series adds room for its largest point.

`scatterChartDefaults` is frozen. A `handleScroll` or `handleScale` object you
pass switches on just the flags it sets; `true` switches them all on. To build
the chart yourself, give `createChartEx` both type arguments, which it cannot
infer:
`createChartEx<number, ScatterHorzScaleBehavior>(container, new ScatterHorzScaleBehavior(), scatterChartDefaults)`.

The series manages the chart's `timeScale.tickMarkMaxCharacterLength`, and
gives the chart its own value back on `remove()`. A crosshair you show
(`CrosshairMode.Normal`) snaps its vertical line to the slots of the X axis,
not to the points; its magnet modes snap to the extremes of a slot.

### Scrolling and zooming

With scrolling or zooming switched on (`handleScroll`, `handleScale`), the
series keeps the user's zoom through data refreshes, option changes and
resizes, and labels the part of the axis in view. A new X range is fitted
again, as `series.fitXDomain()` does. Zoomed out to the span of the fit or
further, wherever the range sat, the user is back at the fit: a pan at that
zoom springs back to it, as does the chart's double-click reset of the time
axis. Keep the fixed edges: they keep the user within the X range, and only at
a fixed edge does the chart move an end label inside the plot. At a free edge
it centres the label on its value, so the series keeps that end of the range
far enough inside for it. To let the user pan past the range, set `xMargins`.
Zoom from code with `chart.timeScale().setVisibleLogicalRange(...)`: a zoom
set through the `timeScale.barSpacing` and `rightOffset` options looks like the
chart's double-click reset, so the series fits the range again.

## Hover, tooltips and legends

`subscribeHoveredPointChange(handler)` is the one subscription a tooltip
needs. After the chart has painted, at most once a frame, it hands the handler
the hovered point — under the pointer, else the one set with
`setHoveredPoint` — whenever anything about it changes (another point, new
data or options, a resize, a rescaled axis), and `null` when there is none any
more, the removal of the series included.

```js
const tooltip = document.getElementById('tooltip'); // absolutely positioned in the chart container

series.subscribeHoveredPointChange(info => {
    if (info === null) {
        tooltip.style.display = 'none';
        return;
    }
    // Pane coordinates: the plot starts after the left price scale, if it is shown.
    const left = chart.priceScale('left').width() + info.x;
    tooltip.textContent = `${info.point.title}: ${info.point.x}, ${info.point.y}`;
    tooltip.style.display = 'block';
    tooltip.style.transform = `translate(${left}px, ${info.y - info.radius}px) translate(-50%, -100%)`;
});
```

It gets what `series.pointById(objectId)` returns: your point, its `index`
and `groupId`, its centre `x` and `y` in pane coordinates (CSS pixels from the
top-left corner of the plot), its `radius` as drawn, and its resolved style.
The chart's crosshair and click events carry the hovered `objectId` in
`param.hoveredInfo` (with `hoveredInfo.series === series.series()`), but come
with pointer moves, and when the series lays the X axis out again, and never
report a point set with `setHoveredPoint`: prefer the subscription. To highlight a point from outside
the chart, a table row say, call `series.setHoveredPoint(objectId)`, and
`null` to clear it.

Build a legend from `series.groups()`, the groups as drawn, with their palette
colour, shape, ring and `pointCount` resolved, and switch them with
`setGroupVisible`:

```js
function renderLegend() {
    legend.replaceChildren(...series.groups().map(group => {
        const item = document.createElement('button');
        item.textContent = `${group.name} (${group.pointCount})`;
        item.style.cssText = `color: ${group.color}; opacity: ${group.visible ? 1 : 0.4}`;
        item.onclick = () => { series.setGroupVisible(group.id, !group.visible); renderLegend(); };
        return item;
    }));
}
renderLegend();
```

The hovered point is drawn on top at `hoveredOpacity`, and can grow
(`hoveredSizeIncrease`) and get a ring (`hoveredRingWidth`). Of overlapping
points the topmost is hovered; over no point, the pointer hovers one within
`hitTestTolerance` pixels.

## Draw your own overlays

For anything else — a shaded region, a band, an annotation — attach a
[series primitive](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives)
to `series.series()`, placed with `series.xToCoordinate(x)` and
`series.series().priceToCoordinate(y)` in its `updateAllViews`, which the
chart calls before every paint. This one shades rectangles given in data
units under the grid and the points — the quadrants of a relative rotation
graph, say:

```ts
import type { IPrimitivePaneView, ISeriesPrimitive } from 'lightweight-charts';
import type { ScatterSeriesApi } from '@tradingview/lwc-plugin-scatter-series';

/** A rectangle in data units. An open end (`null`) runs to the edge of the pane. */
interface ShadedRegion {
    xMin: number | null;
    xMax: number | null;
    yMin: number | null;
    yMax: number | null;
    color: string;
}

function regionShading(scatter: ScatterSeriesApi, regions: readonly ShadedRegion[]): ISeriesPrimitive<number> {
    let boxes: { left: number; right: number; top: number; bottom: number; color: string }[] = [];
    const view: IPrimitivePaneView = {
        zOrder: () => 'bottom',
        renderer: () => ({
            // Whole device pixels within the pane, so that the edges stay sharp.
            draw: target => target.useBitmapCoordinateSpace(({ context, bitmapSize, horizontalPixelRatio: h, verticalPixelRatio: v }) => {
                for (const box of boxes) {
                    const left = Math.max(0, Math.round(box.left * h));
                    const right = Math.min(bitmapSize.width, Math.round(box.right * h));
                    const top = Math.max(0, Math.round(box.top * v));
                    const bottom = Math.min(bitmapSize.height, Math.round(box.bottom * v));
                    if (right > left && bottom > top) {
                        context.fillStyle = box.color;
                        context.fillRect(left, top, right - left, bottom - top);
                    }
                }
            }),
        }),
    };
    return {
        attached: ({ requestUpdate }) => requestUpdate(), // attaching does not repaint the chart
        paneViews: () => [view],
        updateAllViews: () => {
            const series = scatter.series();
            boxes = [];
            if (!series.options().visible) {
                return; // the chart draws the primitives of a hidden series too
            }
            // An open Y end runs to the top of the pane, or to the bottom of an inverted scale.
            const up = series.priceScale().options().invertScale ? Infinity : -Infinity;
            const x = (value: number | null, open: number) => (value === null ? open : scatter.xToCoordinate(value));
            const y = (value: number | null, open: number) => (value === null ? open : series.priceToCoordinate(value));
            for (const region of regions) {
                const left = x(region.xMin, -Infinity);
                const right = x(region.xMax, Infinity);
                const low = y(region.yMin, -up);
                const high = y(region.yMax, up);
                if (left !== null && right !== null && low !== null && high !== null) {
                    boxes.push({ left, right, top: Math.min(low, high), bottom: Math.max(low, high), color: region.color });
                }
            }
        },
    };
}

series.series().attachPrimitive(regionShading(series, [
    { xMin: 100, xMax: null, yMin: 100, yMax: null, color: 'rgba(8, 153, 129, 0.1)' }, // leading
    { xMin: 100, xMax: null, yMin: null, yMax: 100, color: 'rgba(251, 192, 45, 0.12)' }, // weakening
    { xMin: null, xMax: 100, yMin: null, yMax: 100, color: 'rgba(242, 54, 69, 0.08)' }, // lagging
    { xMin: null, xMax: 100, yMin: 100, yMax: null, color: 'rgba(41, 98, 255, 0.08)' }, // improving
]));
```

## Options

In addition to the standard
[series options](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon)
(`priceFormat`, `priceScaleId`, `visible`, `autoscaleInfoProvider`, …):

| Option | Default | Description |
| --- | --- | --- |
| `color` | `'#2962FF'` | Fill colour of points with no group, and of groups when `palette` is empty. |
| `opacity` | `0.65` | Opacity of the points, `0`–`1`. |
| `pointSize` | `9` | Size of the points in CSS pixels, stroke included. |
| `pointSizeLimits` | `{ min: 5, max: 50 }` | Smallest and largest size of any point. |
| `shape` | `'circle'` | `'circle'`, `'square'`, `'diamond'`, `'triangleUp'` or `'triangleDown'`. |
| `strokeColor`, `strokeWidth` | `null`, `1` | Colour (`null`: automatic) and width in CSS pixels (`0`: none) of the ring around every point. |
| `hollow` | `false` | Draw points as open markers. |
| `palette` | `DEFAULT_SCATTER_PALETTE` | Colours of the groups which set none, in group order: ten by default. |
| `groups` | `[]` | The groups, in drawing order. |
| `sizeRange` | `{ min: 5, max: 25 }` | Sizes `sizeValue` is mapped onto, in CSS pixels. |
| `sizeDomain` | `{ min: null, max: null }` | Values mapped to the ends of `sizeRange`; `null` takes the end from the data. |
| `sizeScale` | `'linear'` | Whether the diameter (`'linear'`) or the area (`'area'`) grows with `sizeValue`. |
| `xRange` | `{ min: null, max: null }` | The X axis range; `null` takes the end from the data. |
| `xMargins` | `0` | Room between each end of the X range and the plot edge, in CSS pixels. |
| `xFormatter` | `null` | Formats the X labels; `null` prints the number. |
| `yRange` | `{ min: null, max: null }` | Pins the ends of the Y axis; `null` autoscales. |
| `baselines` | `[]` | Reference lines under the points. |
| `plotBorder` | `visible: false`, `'#9598A1'`, 1 px, solid, every side | Accent border along the edges of the plot (`visible`, `color`, `width`, `style`, `top`, `right`, `bottom`, `left`). |
| `hoveredOpacity` | `1` | Opacity of the hovered point, drawn on top. |
| `hoveredSizeIncrease` | `0` | Pixels added to the size of the hovered point. |
| `hoveredRingWidth`, `hoveredRingGap`, `hoveredRingColor` | `0`, `1`, `null` | Width (`0`: none), distance and colour (`null`: the point's) of a ring around the hovered point. |
| `hitTestTolerance` | `3` | How many pixels outside a point the pointer may be and still hover it. |

`applyOptions` merges nested objects; `groups`, `baselines`, `palette` and
`xFormatter` are replaced whole. `null` sets an option back to its default: an
end of a range to automatic, or (from JavaScript) a whole option. An
`applyOptions` or `setData` call that throws — an `xFormatter` that throws,
say — changes nothing. Set `visible` through the scatter series. Keep the
price line and last-value label off: the underlying values are X axis slots.

## API

`createScatterSeries` returns a `ScatterSeriesApi`:

| Method | Description |
| --- | --- |
| `setData(points)` / `data()` | Replaces / reads the points. The array is copied, the points are not. |
| `applyOptions(options)` / `options()` | Changes / reads (a copy of) the options. |
| `series()` | The underlying custom series, for its price scale and Y conversions. |
| `groups()` | The groups as drawn, resolved, with their point counts, for a legend. |
| `setGroupVisible(groupId, visible)` | Shows or hides a group, keeping its colour and the X axis. |
| `xDomain()` / `fitXDomain()` | The X axis range in use and its tick step / fits it to the plot again. |
| `xToCoordinate(x)` / `coordinateToX(coordinate)` | An X value to a horizontal pane coordinate and back, as the points are drawn, or `null`. |
| `sizeMapping()` | How `sizeValue` maps to sizes, or `null` when no point uses it. |
| `pointById(objectId)` / `hitTest(x, y)` | Where a point is drawn / the point at a pane coordinate, or `null`. |
| `hoveredPoint()` / `setHoveredPoint(objectId \| null)` | Reads / sets the hovered point. |
| `subscribeHoveredPointChange(handler)` / `unsubscribeHoveredPointChange(handler)` | Follows the hovered point: which point, and where it is drawn. |
| `remove()` | Removes the series, and gives the chart back the options the series manages. Safe to call twice, or after `chart.remove()`. |

## Notes

- Requires `lightweight-charts` 5.2 or later, for the custom series hit test
  and the `hoveredInfo` of chart events.
- One scatter series per chart: it holds every group, and creating a second
  throws until the first is removed. Other series on a scatter chart are not
  supported, as their time points break the even spacing of the X axis: use
  `baselines`, a group's `lineVisible`, or a
  [primitive](#draw-your-own-overlays).
- Take the series off with `series.remove()`; one taken off with
  `chart.removeSeries(series.series())` releases itself on the next chart
  event or API call. After `chart.remove()` the API returns `null`.
- `series.series()` serves the price scale and Y conversions, not data or
  scatter options: its data is the slot grid of the X axis, and its own
  `options().hitTestTolerance` is `-Infinity`, which turns the chart's hit test
  of the slots off (the scatter tolerance is in `series.options()`).
- A chart and a series from different copies of the package (the standalone
  build and the main entry point, say) do not mix: `createScatterSeries`
  throws.
