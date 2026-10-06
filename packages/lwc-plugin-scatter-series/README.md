# Scatter series

A scatter and bubble chart for Lightweight Charts™: points placed by two
numbers on a numeric X axis, in named groups with their own colours and marker
shapes, sized by a data value, optionally connected by lines, with baselines
and accent borders around the plot.

Use it to show how two measures relate across many items, where time is not
the horizontal axis. Typical examples: trades by maximum adverse excursion and
result, bonds by maturity and yield with the issue size as the bubble, or
sectors on a relative rotation graph with their recent path as a tail.

The plugin draws the chart content only. Titles, legends and tooltips stay
with your page: the series tells you which point is hovered and where it is
drawn, and you render the rest.

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

const chart = createScatterChart(document.getElementById('container'), { autoSize: true });
const series = createScatterSeries(chart);
series.setData([
    { x: 1, y: 2 },
    { x: 3, y: 5 },
    { x: 4, y: 1 },
]);
</script>
```

## Usage

A scatter series needs a chart whose horizontal scale is a numeric X axis.
`createScatterChart(container, options?)` creates one; it takes the usual
chart options. `createScatterSeries(chart, options?, paneIndex?)` then adds
the series, which holds the whole dataset — every group included — and
returns the scatter series API:

```ts
import { createScatterChart, createScatterSeries, type ScatterPoint } from '@tradingview/lwc-plugin-scatter-series';

// Fields of your own travel with the points; give the series their type.
interface Bond extends ScatterPoint {
    title: string;
}

const chart = createScatterChart(document.getElementById('container')!, {
    autoSize: true,
    layout: { textColor: '#131722' },
});
const series = createScatterSeries<Bond>(chart, {
    groups: [
        { id: 'aaa', name: 'AAA-AA', color: '#089981' },
        { id: 'bbb', name: 'A-BBB', color: '#2962FF' },
        { id: 'hy', name: 'High yield', color: '#FF9800' },
    ],
    sizeRange: { min: 5, max: 30 },
    sizeScale: 'area',
    xRange: { min: 0, max: 30 },
    yRange: { min: 0, max: 12 },
    xFormatter: (x: number) => `${x}Y`,
    priceFormat: { type: 'custom', minMove: 0.01, formatter: (y: number) => `${y.toFixed(2)}%` },
});

series.setData([
    { id: 'PEMX1', x: 4.5, y: 3.2, group: 'aaa', sizeValue: 120, title: 'PEMX1' },
    { id: 'PEMX2', x: 12.1, y: 5.1, group: 'bbb', sizeValue: 40, title: 'PEMX2' },
    { id: 'PEMX3', x: 21.7, y: 9.4, group: 'hy', sizeValue: 75, title: 'PEMX3' },
]);
```

Change any option later with `series.applyOptions({ ... })`, and replace the
points with `series.setData(points)`.

### Points

Each point is an object with these fields. Points need no ordering, and any
number of them may share an X value.

| Field | Type | Description |
| --- | --- | --- |
| `x` | `number` | Horizontal position, in X axis units. Required. |
| `y` | `number` | Vertical position, in price scale units. Required. |
| `id` | `string` | Stable identifier, reported as the `objectId` when the point is hovered. Defaults to the point's index in the data, as a string. Keep it unique (see below). |
| `group` | `string` | Identifier of the group the point belongs to. |
| `sizeValue` | `number` | A value mapped to the point's size (see [Dynamic size](#dynamic-size)). |
| `size` | `number` | Size in CSS pixels, stroke included. Overrides `sizeValue` and the group. |
| `color` | `string` | Fill colour (the outline colour of a hollow point). Overrides the group. |
| `opacity` | `number` | Opacity, `0`–`1`. Overrides the group. |
| `shape` | `ScatterShape` | Marker shape. Overrides the group. |
| `strokeColor` | `string \| null` | Colour of the ring around the point. Left out, the group's (else the series') applies; `null` asks for the automatic colour (the chart background, or the point colour when hollow) even when the group or the series sets one. See [Open and ringed markers](#open-and-ringed-markers). |
| `strokeWidth` | `number` | Width of the ring in CSS pixels. Overrides the group. |
| `hollow` | `boolean` | Draw the point as an open marker. Overrides the group. |

Any other field is kept as it is and handed back with the point by the hover
API, so the data you show in a tooltip can travel with the point. In
TypeScript, give the series your point type:

```ts
import { createScatterSeries, type ScatterPoint } from '@tradingview/lwc-plugin-scatter-series';

interface Bond extends ScatterPoint {
    title: string;
    volume: number;
}

const bonds = createScatterSeries<Bond>(chart);
bonds.setData([{ id: 'PEMX1', x: 4.5, y: 3.2, title: 'PEMX1', volume: 120, sizeValue: 120 }]);
const info = bonds.pointById('PEMX1'); // info.point is a Bond
```

A point whose `x` or `y` is not a finite number is not drawn. A point outside
the X axis range is not drawn either.

A style a point leaves out comes from its group, then from the series.
`strokeColor` is the only field that also takes `null`, and `null` is not the
same as leaving it out: it asks for the automatic colour, over whatever the
group or the series sets. The same holds for a group's `strokeColor`.

Give points an `id` when the data is updated while the user hovers it: an id
derived from the index may refer to another point after `setData`. Keep ids
unique: the pointer still hovers and highlights the point under it, but
`pointById`, `setHoveredPoint` and `hoveredInfo.objectId` cannot tell points
sharing an id apart (`pointById` returns the first), and the series warns
once in the console.

### Groups and marker shapes

A group is a named set of points sharing a style — what a user calls a
"series" of the scatter chart. Declare groups in the `groups` option, in
drawing order; each point names its group with `group`. A group a point names
but which is not declared is added after the declared ones, in order of first
appearance, styled like a group which sets nothing.

```js
series.applyOptions({
    groups: [
        { id: 'aaa', name: 'AAA-AA', color: '#089981', shape: 'circle' },
        { id: 'bbb', name: 'A-BBB', shape: 'diamond' },
        { id: 'hy', name: 'High yield', shape: 'triangleUp', visible: false },
    ],
});
```

A group without a `color` takes the entry of the `palette` option for its
position: blue, green, orange, cyan, raspberry, yellow, pink, light blue,
purple, red. The shapes are `circle`, `square`, `diamond`, `triangleUp` and
`triangleDown`.

A hidden group (`visible: false`) is not drawn, not hovered and not taken into
account by the price scale — the way a legend switches a group off. It keeps
its place everywhere else: the automatic X axis range and the automatic size
domain are taken from every group, so switching groups off and on never moves
the X axis or resizes the bubbles of the others. `groups` is replaced as a
whole by `applyOptions`, so pass every group again with the one that changed —
or call `series.setGroupVisible(id, visible)`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | — | Identifier points refer to. Required. |
| `name` | `string` | `id` | Display name, for your legend. |
| `color` | `string` | the palette entry | Fill colour of the points. |
| `opacity` | `number` | `1` with `lineVisible`, else the series `opacity` | Opacity of the points, `0`–`1`. |
| `shape` | `ScatterShape` | the series `shape` | Marker shape. |
| `pointSize` | `number` | the series `pointSize` | Size of the points in CSS pixels, stroke included. |
| `strokeColor` | `string \| null` | the series `strokeColor` | Colour of the ring around the points. Left out, the series' applies; `null` asks for the automatic colour (the chart background, or the point colour when hollow) even when the series sets one. |
| `strokeWidth` | `number` | the series `strokeWidth` | Width of the ring in CSS pixels. |
| `hollow` | `boolean` | the series `hollow` | Draw the points as open markers. |
| `visible` | `boolean` | `true` | Whether the group is drawn, hovered and scaled. |
| `lineVisible` | `boolean` | `false` | Connect the points of the group with a line, in data order. |
| `lineWidth` | `number` | `1` | Width of the line in CSS pixels. |
| `lineColor` | `string` | the group colour | Colour of the line. |
| `lineStyle` | `LineStyle` | `LineStyle.Solid` | Style of the line. |

As on points, `strokeColor` is the only field of a group that takes `null`:
left out, the group has the series' ring colour; `null`, the automatic one.

### A legend for the groups

`series.groups()` returns the groups as the series draws them, in drawing
order: every field of a group resolved — the palette colour of a group without
one, the default shape, opacity and size, whether its markers are `hollow` and
the `strokeColor` and `strokeWidth` of their ring or outline as drawn on a
point of the group's `pointSize` (the automatic colour resolved, the width
capped to a quarter of that size, as `pointById` reports it for such a point)
— with its `visible` state and its `pointCount`. Build the legend from it
rather than from your options, and switch a group with `setGroupVisible`,
which also works for a group the points name without declaring it (it keeps
its palette colour):

```js
function renderLegend() {
    legend.replaceChildren(...series.groups().map(group => {
        const item = document.createElement('button');
        item.textContent = `${group.name} (${group.pointCount})`;
        item.style.color = group.color;
        item.style.opacity = group.visible ? '1' : '0.4';
        item.onclick = () => {
            series.setGroupVisible(group.id, !group.visible);
            renderLegend();
        };
        return item;
    }));
}
renderLegend();
```

### Connecting lines

With `lineVisible`, the points of a group are joined in the order they appear
in the data — a tail on a relative rotation graph, a path over time. The
points of such a group are opaque unless the group or the point sets an
opacity, so the line does not show through them. Make the last point of a tail
stand out with `size` on that point:

```js
series.setData([
    { group: 'tech', x: 101.2, y: 99.6 },
    { group: 'tech', x: 101.8, y: 100.1 },
    { group: 'tech', x: 102.6, y: 100.6, size: 13 },
]);
```

The line runs through every point of the group with finite coordinates, those
outside the X axis range included, so a tail leaving the plot is cut at its
edge rather than ending at the last point inside.

### Dynamic size

`sizeValue` drives the size of a point. The values are mapped onto
`sizeRange` (5–25 px by default): `sizeDomain.min` to the smallest size and
`sizeDomain.max` to the largest, values beyond the domain to its ends. An open
end of the domain (`null`, the default) is taken from the points of every
group, hidden ones included, so sizes compare across groups and stay as they
are when a group is switched off.

```js
series.applyOptions({
    sizeRange: { min: 5, max: 50 },
    sizeDomain: { min: 0, max: null },
    sizeScale: 'area',
});
```

With `sizeScale: 'linear'` the diameter grows with the value; with `'area'`
the area does, which is what the eye compares in a bubble chart. When every
value is the same, every point is drawn at the middle of the range.

`series.sizeMapping()` returns the mapping in use, for a bubble-size legend
(see [Recipes](#a-bubble-size-legend)), or `null` when no point is sized by
its `sizeValue`.

### Size limits

Every size — `pointSize`, a group's `pointSize`, a point's `size` and both ends
of `sizeRange` — is clamped to `pointSizeLimits`, 5–50 px by default, the
limits of the design; the package exports the defaults as
`SCATTER_MIN_POINT_SIZE` and `SCATTER_MAX_POINT_SIZE`. A size includes the
stroke drawn around the point. Set other limits for denser or bigger plots:

```js
series.applyOptions({
    pointSizeLimits: { min: 2, max: 3 },
    sizeRange: { min: 2, max: 3 },
});
```

Each end of the limits is kept within 1–500 px, an end that is not a finite
number takes its default, and reversed ends are swapped. The ring around a
point is at most a quarter of its size, so a small dot keeps at least half its
diameter for its colour (and a small open marker for its hole): a 2 px dot is
drawn with a 0.5 px ring, a 9 px one with the full 1 px. The series draws
every visible point on each repaint: 5000 points of the default size take
about 6 ms, and 20 000 dots of 2–3 px about 15 ms (a 600 × 300 px plot at a
pixel ratio of 2, whole frame included); a pointer move hit tests them in less
than 0.1 ms.

### Per-point overrides

A point's `color`, `opacity`, `size`, `shape`, `strokeColor`, `strokeWidth`
and `hollow` beat its group's, and the group's beat the series options:

```js
series.setData([
    { x: 4.5, y: 3.2, group: 'aaa', sizeValue: 120 },
    { x: 12.1, y: 5.1, group: 'aaa', color: '#F23645', opacity: 1, size: 22 },
    { x: 18.3, y: 4.4, group: 'aaa', shape: 'diamond' },
]);
```

The size is the point's `size`, else its `sizeValue` mapped as above, else the
group's `pointSize`, else the series `pointSize`. A per-point shape is drawn,
hit tested and reported (`pointById(…).shape`) like any other: colour by
group and shape by a field of your own, for instance.

### Open and ringed markers

Every point has a thin ring around it, `strokeWidth` wide (1 px by default),
which shows where points overlap. Its colour, `strokeColor`, is automatic by
default (`null`): the chart's background, read at every draw so that it
follows a theme change. Set `strokeColor` and `strokeWidth` on the series, a
group or a point:

```js
series.applyOptions({
    groups: [
        { id: 'aaa', name: 'AAA-AA', hollow: true, strokeWidth: 2 },
        { id: 'bbb', name: 'A-BBB', strokeColor: '#131722', strokeWidth: 2 },
    ],
});
```

A `hollow` marker is an open one: an outline and no fill. The outline is
`strokeWidth` wide, but at least 1 px (and, like a ring, at most a quarter of
the size), and drawn at the point's opacity in the point's colour — or in `strokeColor` when the point, its group or the series
sets one; set `strokeColor: null` on a hollow group to get its own colour back
under a series `strokeColor`. Its size includes the outline, as a filled
marker's includes its ring, and the pointer hovers its whole area, the hole
included. `groups()` and `pointById` report the resolved `hollow`,
`strokeColor` (the automatic colour resolved) and `strokeWidth` as drawn —
for `groups()`, on a point of the group's `pointSize` — so that a legend can
draw the same open markers.

### Baselines and borders

Baselines are reference lines across the plot, drawn under the points: on the
Y axis a horizontal line at a Y value, on the X axis a vertical line at an X
value. The price scale keeps horizontal baselines in view, and the automatic X
axis range includes vertical ones.

```js
import { LineStyle } from 'lightweight-charts';

series.applyOptions({
    baselines: [
        { axis: 'y', value: 0 },
        { axis: 'x', value: 45, color: '#9598A1', width: 1, style: LineStyle.Dashed },
    ],
    plotBorder: { visible: true, top: false, right: false },
});
```

| Baseline field | Type | Default | Description |
| --- | --- | --- | --- |
| `axis` | `'x' \| 'y'` | — | `'y'` draws a horizontal line at a Y value, `'x'` a vertical one at an X value. Required. |
| `value` | `number` | — | Where the line is drawn, in units of its axis. Required. |
| `color` | `string` | `'#9598A1'` | Line colour. |
| `width` | `number` | `1` | Line width in CSS pixels. |
| `style` | `LineStyle` | `LineStyle.Solid` | Line style. |

`plotBorder` draws an accent border inside the edges of the plot, on the sides
you choose.

### The X axis

The X axis spans `xRange`. An open end (`null`, the default) is taken from
every point, hidden groups included, and rounded outwards to a nice tick: 1, 2
or 5 × 10ⁿ, about ten intervals across. A given end stays where it is when it
falls on the axis grid — the slots the axis is drawn on, a tenth or a
twentieth of the tick step apart — and is otherwise moved outwards to the
nearest slot: `{ min: 0.05, max: 0.95 }` spans 0.05–0.95 (slots of 0.01),
`{ min: 0.33, max: 9.71 }` spans 0.3–9.8 (slots of 0.1). `series.xDomain()`
returns the range in use. The first and last values of the range sit on the
left and right edges of the plot, so a point at either end is half visible —
set `xMargins` (in pixels) to keep room for the bubbles there:

```js
series.applyOptions({ xMargins: 12 });
```

The chart allows no room past the ends at a fixed edge, so while `xMargins`
is above 0 the series switches the chart's `fixLeftEdge` and `fixRightEdge`
off, and switches them back when the margins return to 0 or the series is
removed. An edge you fix meanwhile is freed again on the next frame, and
fixed when the margins return to 0. Freeing an edge meanwhile is not
noticed — the series has freed it already — so the edges it switches back
are the ones it found: to free them for good, do it with `xMargins` at 0, or
again after setting the margins to 0. With scrolling or zooming switched on,
the user can then pan past the X range; zooming out past the margins brings
the whole range back between them.

The labels are nice round values, evenly spaced. A wide chart labels every
tick of the range; a narrower one thins them out to a coarser nice step,
measured in the chart's font so that no two labels overlap — the ones the
chart pushes inside the ends of the axis included. On the narrowest charts of
the design (300 px) that still leaves two labels or more: when the labels are
so long that no nice step fits two, the two ends of the axis are labelled
instead, and only when even those do not fit side by side is a single label
shown. Format them with `xFormatter`:

```js
series.applyOptions({ xFormatter: x => `${x}Y` });
```

`series.xDomain()` returns the range in use and its tick step. With zooming
switched on (see [The scatter chart](#the-scatter-chart)), the labels are
chosen again for the part of the axis in view, about ten intervals across it.

### The Y axis

The Y axis is the series' price scale. Format it with the standard
`priceFormat` option, and pin either end with `yRange`:

```js
series.applyOptions({
    yRange: { min: 0, max: 12 },
    priceFormat: { type: 'custom', minMove: 0.01, formatter: y => `${y}%` },
});
```

An open end of `yRange` autoscales to the visible points and the horizontal
baselines, with room for the largest point so that bubbles at the extremes are
not cut. A pinned end puts the value at the edge of the scale margins, with no
room added. With no visible point — no data, or every group hidden — the
scale keeps to the range of the hidden points, else to `yRange`, else to the
baselines.

The price scale is on the right. To put it on the left, show the left scale,
hide the right one and move the series to it:

```js
const chart = createScatterChart(container, {
    leftPriceScale: { visible: true },
    rightPriceScale: { visible: false },
});
const series = createScatterSeries(chart, { priceScaleId: 'left' });
```

`series.series()` is the underlying custom series, for anything a series API
offers: `priceScale()`, `priceToCoordinate()`, `coordinateToPrice()` and so on.
Set data and scatter options through the scatter series, not through it. Its
X counterparts are on the scatter series: `series.xToCoordinate(x)` and
`series.coordinateToX(coordinate)` (see
[Draw your own overlays](#draw-your-own-overlays)).

## Hover and tooltips

The plugin renders no tooltip, title or legend. It reports the hovered point
and where it is drawn; your page shows the tooltip.

`subscribeHoveredPointChange(handler)` is the one subscription a tooltip
needs. The handler gets the hovered point — the one under the pointer, else
the one set with `setHoveredPoint` — or `null` when there is none. It runs
after the chart has painted, with the geometry on screen, whenever anything
about the hovered point changes: another point or none, but also the same
point after a data refresh (a new point object, new fields, a new place), a
resize, a rescaled axis, new options or a theme change that recolours its
ring. When the series is removed, or its chart, a handler last given a point
gets `null`, once, so the tooltip goes too. The tooltip placed from it follows
the point:

```js
const tooltip = document.getElementById('tooltip'); // absolutely positioned in the chart container

series.subscribeHoveredPointChange(info => {
    if (info === null) {
        tooltip.style.display = 'none';
        return;
    }
    // Pane coordinates: the plot starts after the left price scale, if it is shown.
    const left = chart.priceScale('left').width() + info.x;
    const top = info.y - info.radius;
    tooltip.textContent = `${info.point.title}: ${info.point.x}, ${info.point.y}`;
    tooltip.style.display = 'block';
    tooltip.style.transform = `translate(${left}px, ${top}px) translate(-50%, -100%)`;
});
```

The handler gets the same information as `pointById(objectId)`: the point as
you passed it (`point`, with your own fields), its `index` and `groupId`, its
centre `x` and `y` in pane coordinates (CSS pixels from the top-left corner of
the plot), its `radius` (half its size, stroke included — grown by
`hoveredSizeIncrease` while it is hovered), and its resolved `color`,
`opacity`, `shape`, `hollow`, `strokeColor` and `strokeWidth` (as drawn).
`pointById` returns `null` for a point that is not drawn: a hidden group or
series, a point outside the X range, or a marker entirely outside the plot. A point partly outside the plot (above a pinned Y
range, say) is drawn and hovered, and has its geometry.

The chart's crosshair events also carry the hovered point's `objectId` in
`param.hoveredInfo` (with `param.hoveredInfo.series === series.series()`),
for pages already listening to them; read the geometry with `pointById`. Only
the subscription covers points hovered with `setHoveredPoint` and changes no
pointer move reports.

The hovered point is drawn on top of the others at `hoveredOpacity` (fully
opaque by default) and the cursor becomes a pointer. When points overlap, the
pointer hovers the one drawn on top. The pointer hovers a marker by its drawn
shape, and a small dot within `hitTestTolerance` pixels (3 by default) of its
edge.

The hovered point can also grow and get a ring, both off by default:

```js
series.applyOptions({
    hoveredSizeIncrease: 4, // pixels added to its size
    hoveredRingWidth: 2, // 0 draws no ring
    hoveredRingGap: 2, // room between the point and its ring
    hoveredRingColor: null, // the point's colour; or a colour of your own
});
```

They apply alike to the point under the pointer and to one set with
`setHoveredPoint`. The grown point is hit tested at its grown size, so the
pointer does not lose it at its edge; `pointById`, `hoveredPoint` and the
subscription report its grown `radius`. The ring lies outside that radius —
`hoveredRingGap + hoveredRingWidth` pixels further — follows the marker's
shape at an even distance, is drawn with the point on top of the others at
`hoveredOpacity`, and is not hovered itself: leave room for it when you place
a tooltip from the radius. The price scale keeps room for a grown and ringed
point at the top and the bottom, as it does for the largest point.

To highlight a point from outside the chart — a legend or a table row under
the pointer — call `series.setHoveredPoint(objectId)`, and
`series.setHoveredPoint(null)` to clear it. A point under the pointer takes
precedence. `series.hoveredPoint()` returns the hovered point, and
`series.hitTest(x, y)` the point at a pane coordinate, for pages that handle
the pointer themselves.

The chart applies new data and options on its next frame: read geometry from
the subscription, or a frame after `setData`, rather than right after it.

## Options

In addition to the standard
[series options](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon)
(`priceFormat`, `priceScaleId`, `visible`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | `'#2962FF'` | Fill colour of points with no group and of groups when `palette` is empty. |
| `opacity` | `number` | `0.65` | Opacity of the points, `0`–`1`. |
| `pointSize` | `number` | `9` | Size of the points in CSS pixels, stroke included. Clamped to `pointSizeLimits`. |
| `pointSizeLimits` | `{ min, max }` | `{ min: 5, max: 50 }` | Smallest and largest size of any point, in CSS pixels. Each end within 1–500. See [Size limits](#size-limits). |
| `shape` | `ScatterShape` | `'circle'` | Marker shape: `'circle'`, `'square'`, `'diamond'`, `'triangleUp'` or `'triangleDown'`. |
| `strokeColor` | `string \| null` | `null` | Colour of the thin ring around every point. `null` takes the chart's background (the top colour of a gradient) at every draw, so it follows a theme change — and the point's colour for a hollow point. |
| `strokeWidth` | `number` | `1` | Width of the ring in CSS pixels, at most a quarter of the point's size. `0` draws none. |
| `hollow` | `boolean` | `false` | Draw points as open markers: an outline (at least 1 px) and no fill. See [Open and ringed markers](#open-and-ringed-markers). |
| `hoveredOpacity` | `number` | `1` | Opacity of the hovered point, which is drawn on top. |
| `hoveredSizeIncrease` | `number` | `0` | Pixels added to the size of the hovered point. |
| `hoveredRingWidth` | `number` | `0` | Width of a ring around the hovered point, in CSS pixels. `0` draws none. |
| `hoveredRingColor` | `string \| null` | `null` | Colour of that ring. `null` takes the point's colour. |
| `hoveredRingGap` | `number` | `1` | Room between the hovered point and its ring, in CSS pixels. |
| `hitTestTolerance` | `number` | `3` | How many pixels outside a point the pointer may be and still hover it. |
| `palette` | `string[]` | `DEFAULT_SCATTER_PALETTE` | Colours of the groups which set none, in group order. |
| `groups` | `ScatterGroup[]` | `[]` | The groups, in drawing order. See [Groups](#groups-and-marker-shapes). |
| `sizeRange` | `{ min, max }` | `{ min: 5, max: 25 }` | Sizes `sizeValue` is mapped onto, in CSS pixels. Each end clamped to `pointSizeLimits`. |
| `sizeDomain` | `{ min, max }` | `{ min: null, max: null }` | The values mapped to the ends of `sizeRange`. `null` takes the end from the data. |
| `sizeScale` | `'linear' \| 'area'` | `'linear'` | Whether the diameter or the area grows linearly with `sizeValue`. |
| `xRange` | `{ min, max }` | `{ min: null, max: null }` | The X axis range. `null` takes the end from the data, rounded to a nice tick; a given end off the axis grid is moved outwards to it. |
| `xMargins` | `number` | `0` | Room between each end of the X range and the plot edge, in CSS pixels, at most a quarter of the plot. Above 0, frees the chart's fixed edges. |
| `yRange` | `{ min, max }` | `{ min: null, max: null }` | Pins the ends of the Y axis. `null` autoscales. |
| `xFormatter` | `((x: number) => string) \| null` | `null` | Formats the X axis labels. `null` prints the number with the decimals the tick step needs. |
| `baselines` | `ScatterBaseline[]` | `[]` | Reference lines under the points. See [Baselines](#baselines-and-borders). |
| `plotBorder` | `ScatterPlotBorder` | `{ visible: false, color: '#9598A1', width: 1, style: LineStyle.Solid, top: true, right: true, bottom: true, left: true }` | Accent border along the edges of the plot. |

`applyOptions` merges nested objects (`sizeRange`, `plotBorder`, …) into the
current options. `null` sets an end of a range, `strokeColor`,
`hoveredRingColor` or `xFormatter` back to automatic; a field left out (or
`undefined`) keeps its value. `groups`, `baselines`, `palette` and
`xFormatter` are replaced as a whole. The series copies what it is given and
`options()` returns a copy: changing either object afterwards changes neither
the series nor the defaults. Set `visible` through the scatter series too, so
that the hovered point is updated. The series draws no price line or
last-value label by default, and should not: its values are those of the X
axis grid (see [Notes](#notes)), not of a point.

## API

`createScatterSeries` returns a `ScatterSeriesApi`:

| Method | Description |
| --- | --- |
| `setData(points)` | Replaces the points. The array is copied, the points are not. |
| `data()` | The points, as last set: a copy of the array, holding your point objects. |
| `applyOptions(options)` / `options()` | Changes / reads (a copy of) the options. |
| `series()` | The underlying custom series, for its price scale and coordinate conversions. |
| `groups()` | The groups as drawn, with resolved colours, shapes, visibility and point counts, for a legend. |
| `setGroupVisible(groupId, visible)` | Shows or hides a group, keeping its colour; the X axis stays as it is. |
| `xDomain()` | The X axis range in use and its tick step. |
| `fitXDomain()` | Fits the X axis range to the plot again. Done automatically when the range changes, on resizes unless the user zoomed, and when the user zooms out to the whole range. |
| `xToCoordinate(x)` | The horizontal pane coordinate of an X value, in CSS pixels from the left edge of the pane, as the points are drawn — off the pane for a value out of view — or `null` (see [Draw your own overlays](#draw-your-own-overlays)). |
| `coordinateToX(coordinate)` | The X value at a horizontal pane coordinate: the inverse of `xToCoordinate`, or `null`. |
| `sizeMapping()` | How `sizeValue` maps to sizes — `domain`, `range`, `scale` and `sizeFor(value)` — as the points are drawn, or `null` when no point uses `sizeValue`. |
| `pointById(objectId)` | Where a point is drawn, or `null`. |
| `hitTest(x, y)` | The point at a pane coordinate, or `null`. |
| `hoveredPoint()` | The hovered point, or `null`. |
| `setHoveredPoint(objectId \| null)` | Highlights a point from outside the chart. |
| `subscribeHoveredPointChange(handler)` / `unsubscribeHoveredPointChange(handler)` | Follows the hovered point: which point, and where it is drawn. |
| `remove()` | Removes the series from the chart, gives the hovered-point subscribers `null` if they were last given a point, and gives the chart back its `tickMarkMaxCharacterLength` and fixed edges. Safe to call twice, or after `chart.remove()`. |

## The scatter chart

`createScatterChart` is `createChartEx` with a numeric horizontal scale
behaviour (`ScatterHorzScaleBehavior`) and these defaults
(`scatterChartDefaults`), which any option you pass overrides:

- scrolling and zooming are off, so the X axis always spans its range edge to
  edge;
- the crosshair is hidden (`CrosshairMode.Hidden`) — hover and the crosshair
  events keep working (see [Showing the crosshair](#showing-the-crosshair) to
  bring it back);
- dotted grid lines, no axis borders, and small price scale margins;
- `timeScale.uniformDistribution`, which keeps the X labels evenly spaced;
- fixed edges (`timeScale.fixLeftEdge` and `fixRightEdge`), so that with
  scrolling or zooming switched on the user cannot pan or zoom out past the X
  range.

If you switch scrolling or zooming back on, the series keeps the user's zoom
through data refreshes, option changes and resizes; a new X range fits the
whole range again, as does `series.fitXDomain()`. Zooming out as far as the
fixed edges allow — the chart stops a few pixels short of the edges — or past
the `xMargins`, the user sees the whole range: the series fits it exactly, and
keeps it fitted through resizes. Zoomed in, the X labels are chosen again for
the part of the axis in view. Map your reset control (a
button, or a double-click on the chart) to `series.fitXDomain()` and
`priceScale(…).applyOptions({ autoScale: true })`: the chart's own
double-click reset of the time axis knows nothing of the X range.

Keep the fixed edges when you enable scrolling or zooming. The chart keeps the
first and last X labels inside the plot only at a fixed edge; at a free edge
it centres them on the plot edge, where they are cut in half. With scrolling
and zooming off, as by default, the chart treats both edges as fixed anyway.

To build the chart
yourself, pass the behaviour to `createChartEx` with both type arguments,
which it cannot infer:

```ts
import { createChartEx } from 'lightweight-charts';
import { ScatterHorzScaleBehavior, scatterChartDefaults, createScatterSeries } from '@tradingview/lwc-plugin-scatter-series';

const chart = createChartEx<number, ScatterHorzScaleBehavior>(container, new ScatterHorzScaleBehavior(), scatterChartDefaults);
const series = createScatterSeries(chart);
```

## Recipes

### Selecting a point on click

The chart's click events carry the clicked point's `objectId`, as its
crosshair events do. Keep the selection highlighted with `setHoveredPoint`
(the point under the pointer still takes precedence while it is hovered):

```js
chart.subscribeClick(param => {
    const info = param.hoveredInfo;
    const id = info !== undefined && info.series === series.series() ? info.objectId : undefined;
    series.setHoveredPoint(typeof id === 'string' ? id : null);
});
```

### A logarithmic or inverted Y axis

The Y axis is the series' price scale, so its modes apply as they are; points,
hit tests and `pointById` follow:

```js
import { PriceScaleMode } from 'lightweight-charts';

series.series().priceScale().applyOptions({ mode: PriceScaleMode.Logarithmic }); // for positive Y values
series.series().priceScale().applyOptions({ invertScale: true }); // the largest Y at the bottom
```

The percentage and indexed-to-100 modes are not meaningful here: they show Y
relative to the first value in view, which for a scatter series is the first
slot of the X axis in view (see [Notes](#notes)), not a point anyone can see.
The series warns once in the console when either is set. For the Y axis on the
left, see [The Y axis](#the-y-axis).

### Showing the crosshair

A scatter chart hides the crosshair. Bring it back with `CrosshairMode.Normal`:

```js
import { CrosshairMode } from 'lightweight-charts';

chart.applyOptions({ crosshair: { mode: CrosshairMode.Normal } });
```

Its horizontal line follows the pointer and its label uses the series'
`priceFormat`. Its vertical line snaps to the slots of the X axis — a tenth or
a twentieth of the tick step apart — rather than to the points, which are
drawn at their exact X; its label uses `xFormatter`. Avoid the magnet modes
(`Magnet`, `MagnetOHLC`): they snap the horizontal line to the values of the
slot under the pointer — the extremes of the points sharing it, not the
nearest point — and leave it free over empty slots. Hover and tooltips need no
crosshair at all.

### Dates on the X axis

The X axis is numeric. For dates, pass timestamps and format them:

```js
series.applyOptions({
    xFormatter: x => new Date(x * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
});
series.setData(trades.map(trade => ({ id: trade.id, x: trade.closedAt, y: trade.pnl }))); // seconds
```

The ticks are nice numbers of the X unit — 5,000,000 seconds (about 58
days), say — not calendar boundaries: the labels do not fall on the first of
a month. The automatic range is rounded outwards to such a tick; pin it with
`xRange` (snapped to the axis grid) to start nearer the data.

### A bubble-size legend

`series.sizeMapping()` gives the mapping the series sizes points with: the
`domain` of values (an open end of `sizeDomain` taken from every point, hidden
groups included), the `range` of sizes in pixels (`sizeRange` within
`pointSizeLimits`), the `scale`, and `sizeFor(value)`, the diameter a point
with that `sizeValue` is drawn at, stroke included — the very function the
points are sized with, so the legend matches the plot:

```js
function renderSizeLegend() {
    const mapping = series.sizeMapping();
    sizeLegend.replaceChildren();
    if (mapping === null) {
        return; // no point is sized by its value
    }
    const { min, max } = mapping.domain;
    for (const value of [min, (min + max) / 2, max]) {
        const size = mapping.sizeFor(value);
        const bubble = document.createElement('span');
        bubble.style.cssText = `display:inline-block;width:${size}px;height:${size}px;border-radius:50%;border:1px solid #9598A1`;
        sizeLegend.append(bubble, ` ${value} `);
    }
}
```

It is a snapshot: render the legend again after `setData` and `applyOptions`.

### Draw your own overlays

The series draws points, connecting lines, baselines and borders. For anything
else — a shaded region, a band, a label, an annotation — attach a
[series primitive](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives)
of your own to `series.series()`, and place it with the series' two
conversions: `series.xToCoordinate(x)` for X and
`series.series().priceToCoordinate(y)` for Y, and back with
`series.coordinateToX(coordinate)` and `series.series().coordinateToPrice(coordinate)`.
They work in pane coordinates, CSS pixels from the top-left corner of the
plot, like `pointById`. Do not add other series for it: they break the X axis
(see [Notes](#notes)).

`xToCoordinate` maps X exactly as the points are drawn: it follows the user's
zoom, `xMargins` and resizes, and gives a value out of view — or outside the X
range — a coordinate outside the pane, so that a shape crossing an edge is
drawn up to it. It is axis maths, so hiding the series or a group does not
change it. It returns `null` for a value that is not a finite number, for a
series taken off the chart, and once the series or its chart is removed.
Convert while the chart paints — in the
primitive's `updateAllViews`, which the chart calls before every paint with
the scales of that paint — or from a hover handler: right after `setData` the
chart has not applied a new X range yet.

This primitive shades rectangles given in data units, under the grid and the
points — the quadrants of a relative rotation graph, say:

```ts
import type { IPrimitivePaneView, ISeriesPrimitive, SeriesAttachedParameter } from 'lightweight-charts';
import type { ScatterSeriesApi } from '@tradingview/lwc-plugin-scatter-series';

/** A rectangle in data units. An open end (`null`) runs to the edge of the pane. */
interface ShadedRegion {
    xMin: number | null;
    xMax: number | null;
    yMin: number | null;
    yMax: number | null;
    color: string;
}

/** Shades rectangles of a scatter plot, under the grid and the points. */
class RegionShading implements ISeriesPrimitive<number> {
    private readonly _scatter: ScatterSeriesApi;
    private _regions: readonly ShadedRegion[];
    private _boxes: { left: number; right: number; top: number; bottom: number; color: string }[] = [];
    private _requestUpdate: (() => void) | null = null;
    private readonly _views: readonly IPrimitivePaneView[] = [{
        zOrder: () => 'bottom',
        renderer: () => ({
            draw: target => target.useBitmapCoordinateSpace(({ context, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) => {
                for (const box of this._boxes) {
                    // Whole device pixels, within the pane.
                    const left = Math.max(0, Math.round(box.left * horizontalPixelRatio));
                    const right = Math.min(bitmapSize.width, Math.round(box.right * horizontalPixelRatio));
                    const top = Math.max(0, Math.round(box.top * verticalPixelRatio));
                    const bottom = Math.min(bitmapSize.height, Math.round(box.bottom * verticalPixelRatio));
                    if (right > left && bottom > top) {
                        context.fillStyle = box.color;
                        context.fillRect(left, top, right - left, bottom - top);
                    }
                }
            }),
        }),
    }];

    public constructor(scatter: ScatterSeriesApi, regions: readonly ShadedRegion[]) {
        this._scatter = scatter;
        this._regions = regions;
    }

    public attached({ requestUpdate }: SeriesAttachedParameter<number>): void {
        this._requestUpdate = requestUpdate;
        // Attaching does not repaint the chart: ask for the first paint.
        requestUpdate();
    }

    public detached(): void {
        this._requestUpdate = null;
    }

    /** Replaces the regions; the chart paints them on its next frame. */
    public setRegions(regions: readonly ShadedRegion[]): void {
        this._regions = regions;
        this._requestUpdate?.();
    }

    /** Called by the chart before every paint: convert with the scales of that paint. */
    public updateAllViews(): void {
        const series = this._scatter.series();
        this._boxes = [];
        // The chart draws the primitives of a hidden series too: draw nothing then.
        if (!series.options().visible) {
            return;
        }
        // An open Y end runs to the top of the pane, or to the bottom of an inverted scale.
        const up = series.priceScale().options().invertScale ? Infinity : -Infinity;
        const x = (value: number | null, open: number) => (value === null ? open : this._scatter.xToCoordinate(value));
        const y = (value: number | null, open: number) => (value === null ? open : series.priceToCoordinate(value));
        for (const region of this._regions) {
            const left = x(region.xMin, -Infinity);
            const right = x(region.xMax, Infinity);
            const low = y(region.yMin, -up);
            const high = y(region.yMax, up);
            if (left !== null && right !== null && low !== null && high !== null) {
                this._boxes.push({ left, right, top: Math.min(low, high), bottom: Math.max(low, high), color: region.color });
            }
        }
    }

    public paneViews(): readonly IPrimitivePaneView[] {
        return this._views;
    }
}
```

```ts
const quadrants = new RegionShading(series, [
    { xMin: 100, xMax: null, yMin: 100, yMax: null, color: 'rgba(8, 153, 129, 0.1)' }, // leading
    { xMin: 100, xMax: null, yMin: null, yMax: 100, color: 'rgba(251, 192, 45, 0.12)' }, // weakening
    { xMin: null, xMax: 100, yMin: null, yMax: 100, color: 'rgba(242, 54, 69, 0.08)' }, // lagging
    { xMin: null, xMax: 100, yMin: 100, yMax: null, color: 'rgba(41, 98, 255, 0.08)' }, // improving
]);
series.series().attachPrimitive(quadrants);
```

It draws in the bitmap coordinate space, in whole device pixels, so that its
edges stay sharp at any pixel ratio, and with `zOrder: 'bottom'` under the
grid and the points. The chart draws a series primitive even while its series
is hidden, so the primitive clears its boxes while the scatter series is not
`visible`. The chart repaints by itself when its scales change;
`requestUpdate()` asks it to for changes it cannot see — attaching the
primitive, new regions. A primitive on `series.series()` goes with the series
when it is removed; detach it earlier with
`series.series().detachPrimitive(quadrants)`.

### Panning past the X range

With scrolling or zooming switched on, the scatter chart's fixed edges
(`timeScale.fixLeftEdge` and `fixRightEdge`) keep the user within the X range.
Switch them off to let the user pan past it:

```js
chart.applyOptions({
    handleScroll: true,
    handleScale: true,
    timeScale: { fixLeftEdge: false, fixRightEdge: false },
});
```

At a free edge the chart centres the first and last X labels on the plot
edges, where they are cut in half; with fixed edges it moves them inside. To
keep room past the ends — for the bubbles there — and labels that fit, prefer
`xMargins`: it frees the edges itself while it is above 0 (see
[The X axis](#the-x-axis)).

## Notes

- Requires `lightweight-charts` 5.2 or later: hover reporting relies on the
  custom series hit test and the `hoveredInfo` of crosshair events, as the
  chart provides them from 5.2.
- One scatter series per chart. It holds every group, so a chart needs no
  more, and creating a second one throws until the first is removed. Adding
  other series to a scatter chart is not supported either: their time points
  break the even spacing of the X axis, and with it every X coordinate. Draw
  reference lines with `baselines`, paths with a group's `lineVisible`, and
  anything else with a primitive of your own (see
  [Draw your own overlays](#draw-your-own-overlays)).
- Take the series off with `series.remove()`, which also releases its
  subscriptions. A series taken off with `chart.removeSeries(series.series())`
  is only released when the next scatter series is added to the chart.
  Removing the chart first (`chart.remove()`, with or without
  `series.remove()` later) is safe: from then on the API returns `null` and
  does nothing, and the hovered-point subscribers get `null` once — on the next
  frame when a hover change was pending, else from `series.remove()`.
- Pages listening to the chart's visible range
  (`subscribeVisibleLogicalRangeChange`) never get a `null` range from the
  series. Data and options that keep the number of slots of the X axis report
  no range, and labels weighed again (for a new `xFormatter`, or a new width)
  add none of their own. A new X range with another number of slots makes the chart report
  the ranges it passes through as it takes the new slots — during the
  `setData` or `applyOptions` call itself — and then the fitted range on the
  next frame: take the last range reported before a frame.
- The chart's behaviour is recognised with `instanceof`, and the axis state
  lives in the copy of the package that created it: a chart built with the
  standalone build's `ScatterHorzScaleBehavior` and a series from the main
  entry point (or two copies of the package) do not mix, and
  `createScatterSeries` throws a clear error.
- The X axis is drawn on a grid of evenly spaced slots (at most 2000) that the
  series sets as the data of its underlying series; points are drawn at their
  exact X between them. Do not call `setData` on `series()`. The first and the
  last slot always carry a value inside the visible Y range, so that the axes
  are laid out even with nothing to draw; the series' own first and last
  values — what a last-value label or a percentage price scale would read —
  mean nothing, which is why the last-value label and the price line are off.
- The series manages the chart's `timeScale.tickMarkMaxCharacterLength`, which
  sets how far apart the X labels are, and gives the chart back its own value
  on `remove()`.
- The series is built for the design limits of a scatter chart — up to ten
  groups and 5000 points — and draws every visible point on each repaint; see
  [Size limits](#size-limits) for timings up to 20 000 points. Options that
  only change how the hovered point or the plot is painted
  (`hoveredOpacity`, the hover styling, `plotBorder`) just repaint; options
  that style the points (colours, sizes, shapes, strokes, `hollow`) resolve
  the points again but leave the X axis and its slots as they are.
- A percentage or indexed-to-100 price scale reads the series' first value in
  view, the first slot of the X axis: it is not meaningful, and the series
  warns once when either mode is set (see
  [A logarithmic or inverted Y axis](#a-logarithmic-or-inverted-y-axis)).
- With no data the X axis spans 0–10; with no visible point the axes stay as
  the data sets them, and the border and baselines are drawn.
