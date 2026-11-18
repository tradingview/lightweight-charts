# Chart Navigator example

An overview chart with a draggable range controlling a second, main chart.
This is a copy-and-adapt example, not a core chart feature or a published package.
It uses only public chart APIs and a DOM overlay. No canvas hit testing or
internal chart state is needed.

- Drag either handle to resize the selected range (minimum span: one logical interval).
- Drag the selected window to pan without changing its span.
- Click outside the window to center the same span at that point.
- Focus a handle or the window and use Left/Right; Shift moves ten bars. Home/End jump to the boundaries.
- Scroll or zoom the main chart normally; the overview selection follows it.

The demo loads identical, static data into both charts. Logical ranges refer to
the ordered union of time points, not elapsed time: both charts must have the
same time points, including whitespace points. Different trading calendars,
downsampled overview data, live updates and multiple panes need additional
mapping and lifecycle handling. A one-interval span is an index distance, not a
promise that a calendar day has that duration.

The example is limited to one overview pane. The overview disables its own
scroll/scale gestures and fits all data. Its price
scales are hidden; the overlay uses the overview time scale's public coordinate
conversion at integer anchors, width and size subscription. It interpolates
between those anchors to support fractional visible ranges on this version. The main chart retains normal gestures.
The example CSS keeps the chart's TradingView attribution link above the overlay
so it remains visible and clickable. Preserve that rule when adapting the CSS.
The demo uses a small minimum bar spacing so a narrow viewport can show all data.
For much larger datasets choose a suitable spacing or a time-based mapping.

Import `ChartNavigator` and `navigator.css`, then create an instance after setting
both series' data and the initial chart ranges. The overview container needs
`position: relative`. Call `navigator.remove()` **before** removing either chart;
it unsubscribes all range/size listeners, disconnects the resize observer, and
removes the overlay and DOM events.
The demo does this on page exit unless the page enters the back/forward cache.

Run `pnpm dev` in `plugin-examples` and open
`/src/plugins/chart-navigator/example/`. See [the gallery instructions](../../../README.md)
for installation and build steps.

## Checks

After building the library, run `pnpm test:navigator` in `plugin-examples` for
mouse, keyboard, touch, resize and cleanup browser checks. The browser uses the
repository's Puppeteer setup; `PUPPETEER_EXECUTABLE_PATH` can select an installed
Chrome. Set `NO_SANDBOX=1` only if your environment requires it. Optional
`NAVIGATOR_SCREENSHOT_DIR` saves the demo and narrow-viewport screenshots.
The range arithmetic tests are included in the root `pnpm test` command.
These checks cover Chromium, not every browser or assistive technology.
