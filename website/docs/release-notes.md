---
title: Release Notes
description: List of changes made for each release of the library.
keywords:
    - charts
    - changelog
    - canvas
    - charting library
    - charting
    - html5 charts
    - financial charting library
sidebar_position: 8
---

<!-- markdownlint-disable no-emphasis-as-heading -->
<!-- ^ using emphasis as headings so we don't have duplicate headers -->
## 4.1.7

**Enhancements**

- Further Refinement of the Price Scale Label Alignment (PR [#1630](https://github.com/tradingview/lightweight-charts/pull/1630))

[Changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v4.1.6..v4.1.7).

## 4.1.6

**Enhancements**

- Improved Price Scale Label Alignment: Enhanced the alignment algorithm for price scale labels to ensure they do not move out of the viewport. This improves the visibility of price labels, particularly when they are near the edges of the scale. Fixes [#1620](https://github.com/tradingview/lightweight-charts/issues/1620) (PR [#1621](https://github.com/tradingview/lightweight-charts/pull/1621))

[Changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v4.1.5..v4.1.6).

## 4.1.5

**Enhancements**

- Added `IHorzScaleBehavior.shouldResetTickmarkLabels`. (PR [#1614](https://github.com/tradingview/lightweight-charts/pull/1614))

[Changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v4.1.4..v4.1.5).

## 4.1.4

**Bug Fixes**

- Fixed hoveredSeries being undefined during series removal and creation. (PR [#1529](https://github.com/tradingview/lightweight-charts/pull/1529), fixes [#1406](https://github.com/tradingview/lightweight-charts/pull/1406), fixes [#1499](https://github.com/tradingview/lightweight-charts/pull/1499))
- Fixed price label rendering artefact. (PR [#1585](https://github.com/tradingview/lightweight-charts/pull/1585), fixes [#1584](https://github.com/tradingview/lightweight-charts/pull/1584))
- Fixed an issue that prevented primitives with `zOrder` set to `top` from drawing above the last price animation. (PR [#1576](https://github.com/tradingview/lightweight-charts/pull/1576))
- Fixed possible ReDos. (PR [#1536](https://github.com/tradingview/lightweight-charts/pull/1536))
- Fixed marker positioning, which could cause a space between histogram and bottom of the chart. (PR [#1538](https://github.com/tradingview/lightweight-charts/pull/1538) & [#1539](https://github.com/tradingview/lightweight-charts/pull/1539), fixes [#1382](https://github.com/tradingview/lightweight-charts/pull/1382))

[Changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v4.1.3..v4.1.4).

## 4.1.3

**Minor Improvements**

- Added option to disable bold labels in the time scale. (PR [#1510](https://github.com/tradingview/lightweight-charts/pull/1510))

**Bug Fixes**

- Fixed sub-pixel horizontal alignment of the crosshair marker and series markers. (PR [#1505](https://github.com/tradingview/lightweight-charts/pull/1505), fixes [#1504](https://github.com/tradingview/lightweight-charts/issues/1504))

[Changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v4.1.2..v4.1.3).

## 4.1.2

**Bug Fixes**

- Fix for 'Total canvas memory use exceeds the maximum limit' error raised on iOS Safari. (PR [#1485](https://github.com/tradingview/lightweight-charts/pull/1485))

**Minor Improvements**

- Improved error messages for price scale margins. (PR [#1489](https://github.com/tradingview/lightweight-charts/pull/1489))

[Changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v4.1.1..v4.1.2).

## 4.1.1

**Bug Fixes**

- Fixed `shiftVisibleRangeOnNewBar` behaviour for realtime updates to a series. Additionally, a new option `allowShiftVisibleRangeOnWhitespaceReplacement` has been added if you wish to have the old 4.0 behaviour for when new data replaces existing whitespace. (PR [#1444](https://github.com/tradingview/lightweight-charts/pull/1444))
- When disabling touch scrolling on the chart via either the `vertTouchDrag` or `horzTouchDrag` setting in the `handleScroll` options, any touch scroll events over the corresponding scale will now be ignored so the page can be scrolled. (PR [#1445](https://github.com/tradingview/lightweight-charts/pull/1445))

[Changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v4.1.0..v4.1.1).

## 4.1.0

Version 4.1 of Lightweight Charts introduces exciting new features, including the introduction of Plugins, which provide developers the ability to extend the library's functionality. Additionally, this release includes enhancements to customize the horizontal scale and various minor improvements and bug fixes.

**Major Updates**

**Plugins**

Developers can now leverage the power of Plugins in Lightweight Charts. Two types of Plugins are supported -  [Custom Series](/plugins/intro.md#custom-series) and [Drawing Primitives](/plugins/intro.md#drawing-primitives), offering the ability to define new series types and create custom visualizations, drawing tools, and annotations.

With the flexibility provided by these plugins, developers can create highly customizable charting applications for their users.

To get started with plugins, please refer to our [Plugins Documentation](/plugins/intro.md) for a better understanding of what is possible and how plugins work. You can also explore our collection of [plugin examples](https://github.com/tradingview/lightweight-charts/tree/master/plugin-examples) (with a [preview hosted here](https://tradingview.github.io/lightweight-charts/plugin-examples/)) for inspiration and guidance on implementing specific functionality.

To help you get started quickly, we have created an NPM package called [create-lwc-plugin](https://www.npmjs.com/package/create-lwc-plugin), which sets up a plugin project for you. This way, you can hit the ground running with your plugin development.

**Horizontal Scale Customization**

The horizontal scale is no longer restricted to only time-based values. The API has been extended to allow customization of the horizontal scale behavior, and enable uses cases like options chart where price values are displayed in the horizontal scale. The most common use-case would be to customise the tick marks behaviour.

The [createChartEx](/api/index.md#createchartex) function should be used instead of the usual `createChart` function, and an instance of a class implementing [IHorzScaleBehavior](/api/interfaces/IHorzScaleBehavior.md) should be provided.

A simple example can be found in this test case: [horizontal-price-scale.js](https://github.com/tradingview/lightweight-charts/blob/master/tests/e2e/graphics/test-cases/horizontal-price-scale.js)

**Enhancements**

- Added point markers styling option for line-based series. (closes [#365](https://github.com/tradingview/lightweight-charts/issues/365)) [Docs](/api/interfaces/LineStyleOptions.md#pointmarkersvisible)
- Added double click subscriber for the main chart pane. (closes [#1385](https://github.com/tradingview/lightweight-charts/issues/1385)) [Docs](/api/interfaces/IChartApi.md#subscribedblclick)
- Added ﻿`setCrosshairPosition` API, allowing programmatic setting of the crosshair position. (fixes [#1198](https://github.com/tradingview/lightweight-charts/issues/1198), [#1163](https://github.com/tradingview/lightweight-charts/issues/1163), [#438](https://github.com/tradingview/lightweight-charts/issues/438)) [Docs](/api/interfaces/IChartApi.md#setCrosshairPosition)
- Added an option to disable crosshair. Introduced the ﻿`Hidden` option in the ﻿`CrosshairMode` setting. (closes [#749](https://github.com/tradingview/lightweight-charts/issues/749), thanks to [@luk707](https://github.com/luk707))
- Allow overriding tick mark label length via the ﻿`tickMarkMaxCharacterLength` option. (closes [#1396](https://github.com/tradingview/lightweight-charts/issues/1396)) [Docs](/api/interfaces/HorzScaleOptions.md#tickmarkmaxcharacterlength)
- Support for overriding the percentage formatter within the localization options. (fixes [#1328](https://github.com/tradingview/lightweight-charts/issues/1328), [#1291](https://github.com/tradingview/lightweight-charts/issues/1291)) [Docs](/api/interfaces/LocalizationOptions.md#percentageformatter)
- Added ﻿`paneSize` getter to `IChartApi`, returning the dimensions of the chart pane. (issue [#1411](https://github.com/tradingview/lightweight-charts/issues/1411)) [Docs](/api/interfaces/IChartApi.md#panesize)
- Added options to set minimum dimensions for the price and time scales. (closes [#1062](https://github.com/tradingview/lightweight-charts/issues/1062), related to [#1163](https://github.com/tradingview/lightweight-charts/issues/1163), [#50](https://github.com/tradingview/lightweight-charts/issues/50)) [Docs](/api/interfaces/TimeScaleOptions.md#minimumheight), [Docs](/api/interfaces/PriceScaleOptions.md#minimumwidth)

**Bug Fixes**

- Fixed chart layout when direction is set to ﻿RTL. (PR [#1338](https://github.com/tradingview/lightweight-charts/pull/1338))
- Fixed re-enabling of `autoSize` after disabling it. (PR [#1274](https://github.com/tradingview/lightweight-charts/pull/1377))
- Corrected percentage mode and zero first value. (fixes [#1386](https://github.com/tradingview/lightweight-charts/issues/1386))
- Prevent chart shifting when new data replaces existing whitespace. (fixes [#1201](https://github.com/tradingview/lightweight-charts/issues/1201))

Thanks to our Contributors for this Release:

- [@luk707](https://github.com/luk707)

You can always send us your feedback via GitHub.
We look forward to hearing from you! And as always, happy trading!

Team TradingView

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/24?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v4.0.1..v4.1.0).

## 4.0.1

**Enhancements**

- Add the ability to specify font colour for the Priceline labels. [#1274](https://github.com/tradingview/lightweight-charts/issues/1274) [#1287](https://github.com/tradingview/lightweight-charts/issues/1287)
- Ignore resize method if `autoSize` is active, and added API to check if active. [#1301](https://github.com/tradingview/lightweight-charts/issues/1301)

**Bug fixes**

- Typo in customization guide. Thanks [@UcheAzubuko](https://github.com/UcheAzubuko). [#1284](https://github.com/tradingview/lightweight-charts/issues/1284)
- Inability to immediately add markers when `autoSize` chart option is enabled. Thanks [@victorbrambati](https://github.com/victorbrambati). [#1271](https://github.com/tradingview/lightweight-charts/issues/1271) [#1281](https://github.com/tradingview/lightweight-charts/issues/1281)
- First render when using `autosize` doesn't show the latest bars. Thanks [@victorbrambati](https://github.com/victorbrambati) [#1281](https://github.com/tradingview/lightweight-charts/issues/1281). [#1282](https://github.com/tradingview/lightweight-charts/issues/1282)
- Series rendering bug when outside of visible range. [#1293](https://github.com/tradingview/lightweight-charts/issues/1293) [#1294](https://github.com/tradingview/lightweight-charts/issues/1294)
- Auto contrast text color for crosshair labels. [#1309](https://github.com/tradingview/lightweight-charts/issues/1309) [#1310](https://github.com/tradingview/lightweight-charts/issues/1310)
- Hit box from the text of marker incorrectly shifted to the right. [#1270](https://github.com/tradingview/lightweight-charts/issues/1270) [#1305](https://github.com/tradingview/lightweight-charts/issues/1305)

As always, we thank you for your support and help in making Lightweight Charts™ the best product on the financial web. And a big shout out to our hero contributors [@victorbrambati](https://github.com/victorbrambati), and [@UcheAzubuko](https://github.com/UcheAzubuko)!

You can always send us your feedback via GitHub.

We look forward to hearing from you! And as always, happy trading!
Team TradingView

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/25?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v4.0.0..v4.0.1).

## 4.0.0

Long overdue as it’s been nearly 1 year since our last major update, but behold before all the changes that have happened over the last 12 months.

In total, more than 20 tickets have been addressed with one of the most important ones being **fancy-canvas** – the library we use to configure HTML canvas in Lightweight Charts™.

Please view the migration guide here: [Migrating from v3 to v4](./migrations/from-v3-to-v4).

**Breaking changes**

- Fancy-canvas 2 | [#818](https://github.com/tradingview/lightweight-charts/issues/818)
- Added support for ES module exports | [#613](https://github.com/tradingview/lightweight-charts/issues/613)
- We are now generating two more build types: esm, standalone & cjs
- Updated scales design | [#606](https://github.com/tradingview/lightweight-charts/issues/606)
  - Changed scales look & feel according to the new design
- Add possibility to disable time axis ticks | [#1043](https://github.com/tradingview/lightweight-charts/issues/1043)
- Added `ticksVisible` to `TimeScaleOptions`, renamed `drawTicks` to `ticksVisible` in `PriceScaleOptions`.
- Custom price lines should be atop of the series | [#684](https://github.com/tradingview/lightweight-charts/issues/684)
  - Price line to be added on top of any series - shout out to thanhlmm
- Remove deprecated code | [#626](https://github.com/tradingview/lightweight-charts/issues/626)
- Fix types inconsistency on API level with time | [#470](https://github.com/tradingview/lightweight-charts/issues/470)
- Add API to get chart values (data, markers, etc) | [#414](https://github.com/tradingview/lightweight-charts/issues/414)
  - Added methods:
    - `ISeriesApi.markers`
    - `ISeriesApi.dataByIndex`
  - Changed time types everywhere in the public API to `Time`

**Enhancements**

- Handle resize with ResizeObserver if it's exist in window | [#71](https://github.com/tradingview/lightweight-charts/issues/71)
  - There was an issue when resizing the chart (such as rotating the screen of a phone/tablet).
- Add possibility to use default tick mark formatter implementation as a fallback | [#1210](https://github.com/tradingview/lightweight-charts/issues/1210)
  - Allow the custom tick mark formatter to return null so that it will use the default formatter for that specific mark.
- Add possibility to invert Area series filled area | [#1115](https://github.com/tradingview/lightweight-charts/issues/1115)
  - Adds invertFilledArea property to the AreaStyleOptions which when set to true will invert the filled area (draw above the line instead of below it).
- Documentation website improvements | [#1001](https://github.com/tradingview/lightweight-charts/issues/1001) [#1002](https://github.com/tradingview/lightweight-charts/issues/1002)
  - Provides a way to apply theme-based colors to a chart whenever the Docusaurus theme is changed.
- Add ability to draw parts of area with different colors | [#1100](https://github.com/tradingview/lightweight-charts/issues/1100)
  - Add a possibility to change line, top and bottom colors for the different parts of an area series
- Add possibility to change price axis text color | [#1114](https://github.com/tradingview/lightweight-charts/issues/1114)
- Reset price and time scale double click options | [#1118](https://github.com/tradingview/lightweight-charts/issues/1118)
  - Distinguishing the reset between price & time scale vs having only one option
- Add curved lines | [#506](https://github.com/tradingview/lightweight-charts/issues/506)
  - Add a new line type that draws curved lines between series points.

**Chores**

- Replace deprecated String.prototype.substr | [#1048](https://github.com/tradingview/lightweight-charts/issues/1048)
  - Shout out to CommanderRoot

**Bug fixes**

- Refactoring resize the chart | [#367](https://github.com/tradingview/lightweight-charts/issues/367)
- The chart is blank on printed page in Chromium | [#873](https://github.com/tradingview/lightweight-charts/issues/873)
  - Chart was blank when printing
- Horizontal scroll animations improvements | [#1136](https://github.com/tradingview/lightweight-charts/issues/1136)
  - Fixes glitches when resetting the chart time scale while scrolling
- Draw series last price & price line labels on the top layer | [#1046](https://github.com/tradingview/lightweight-charts/issues/1046)
  - Fixes an issue where price line could be place over price scale labels
- Incorrect price line labels formatting | [#1032](https://github.com/tradingview/lightweight-charts/issues/1032)
  - When setting the price scale mode to anything than 'Normal' the price for PriceLine wasn't properly calculated.
- lockVisibleTimeRangeOnResize does not work with fixLeftEdge | [#991](https://github.com/tradingview/lightweight-charts/issues/991)
  - The visible range is no longer changed after resizing the chart.
- Crosshair label text appears on the chart during initial render | [#1255](https://github.com/tradingview/lightweight-charts/issues/1255)
  - Small text artefacts from the crosshair no longer appear on the time axis before any interaction with the chart.

As always, we thank you for your support and help in making Lightweight Charts™ the best product on the financial web. And a big shout out to our hero contributors [thanhlmm](https://github.com/thanhlmm), [CommanderRoot](https://github.com/CommanderRoot), [samhainsamhainsamhain](https://github.com/samhainsamhainsamhain) & colleague [Nipheris](https://github.com/Nipheris)!
You can always send us your feedback via GitHub.
We look forward to hearing from you! And as always, happy trading!
Team TradingView

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/18?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.8.0..v4.0.0).

## 3.8.0

We're happy to announce the next release of Lightweight Charts™ library. This release includes many improvements and bug fixes (as usual), but we are thrilled to say that from this version the library has its own [documentation website](https://tradingview.github.io/lightweight-charts/) that replaces the documentation in the repository. Check it out and share your feedback in [this discussion thread](https://github.com/tradingview/lightweight-charts/discussions/921).

**Enhancement**

- Documentation website (see [#875](https://github.com/tradingview/lightweight-charts/issues/875), [#918](https://github.com/tradingview/lightweight-charts/issues/918), [#411](https://github.com/tradingview/lightweight-charts/issues/411), [#919](https://github.com/tradingview/lightweight-charts/issues/919), [#922](https://github.com/tradingview/lightweight-charts/issues/922), [#983](https://github.com/tradingview/lightweight-charts/issues/983), [#980](https://github.com/tradingview/lightweight-charts/issues/980), [#1006](https://github.com/tradingview/lightweight-charts/issues/1006))
- Quick tracking mode (see [#830](https://github.com/tradingview/lightweight-charts/issues/830))
- Improved mouse behaviour on touch devices (like mouse connected to mobile phone/tablet) (see [#106](https://github.com/tradingview/lightweight-charts/issues/106))
- Custom color for items of candlestick and line series (see [#195](https://github.com/tradingview/lightweight-charts/issues/195))
- Labels might be cut off when disabling scale and scroll ([#947](https://github.com/tradingview/lightweight-charts/issues/947))
- Add ability to disable visibility of price line line (see [#969](https://github.com/tradingview/lightweight-charts/issues/969))

**Fixed**

- timeScale.fitContent is not working correctly (see [#966](https://github.com/tradingview/lightweight-charts/issues/966))
- Delegate.unsubscribeAll method works in opposite way (see [#995](https://github.com/tradingview/lightweight-charts/issues/995))
- Last price animation is active when no data added to the right (but to the left) (see [#886](https://github.com/tradingview/lightweight-charts/issues/886))
- subscribeClick on mobile always get the last index of all the items (see [#657](https://github.com/tradingview/lightweight-charts/issues/657))
- Incorrect crosshair position on scrolling by dragging by mouse (see [#987](https://github.com/tradingview/lightweight-charts/issues/987))
- A painting slows down after a while with tons of updates (see [#946](https://github.com/tradingview/lightweight-charts/issues/946))
- Bars disappear with devicePixelRatio less than 1 (see [#982](https://github.com/tradingview/lightweight-charts/issues/982))
- There are no tick marks on the price axis (see [#939](https://github.com/tradingview/lightweight-charts/issues/939))
- Disabling scrolling by disabled horzTouchDrag and vertTouchDrag options disables moving crosshair in tracking mode (see [#434](https://github.com/tradingview/lightweight-charts/issues/434))
- Reducing precision doesn't update price scale width (see [#550](https://github.com/tradingview/lightweight-charts/issues/550))
- Chart width is jumping on series change from area to candles (see [#943](https://github.com/tradingview/lightweight-charts/issues/943))
- Log axis is not scaling on small number (see [#874](https://github.com/tradingview/lightweight-charts/issues/874))
- Overlay series title is not rendered when no series use right price scale (see [#926](https://github.com/tradingview/lightweight-charts/issues/926))
- scrollToPosition with big negative value and when no data breaks the chart (see [#889](https://github.com/tradingview/lightweight-charts/issues/889))
- When rendering multiple charts with baseline series, baseValue of the last element is used on all charts series. (see [#898](https://github.com/tradingview/lightweight-charts/issues/898))

Thanks to our contributors:

- [@zaleGZL](https://github.com/zaleGZL) zale

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/23?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.7.0..v3.8.0).

## 3.7.0

**Enhancement**

- The new baseline series chart (see [#151](https://github.com/tradingview/lightweight-charts/issues/151))
- Documentation about time zones support (see [#781](https://github.com/tradingview/lightweight-charts/issues/781))
- Added methods to get time axis size and subscribe on size change (see [#853](https://github.com/tradingview/lightweight-charts/issues/853))
- Improved performance of setting/updating series data (see [#418](https://github.com/tradingview/lightweight-charts/issues/418) and [#838](https://github.com/tradingview/lightweight-charts/issues/838))
- Use lowerbound in TimeScale timeToIndex search (see [#767](https://github.com/tradingview/lightweight-charts/issues/767))
- Add JSDoc comments for existing API docs (see [#870](https://github.com/tradingview/lightweight-charts/issues/870))

**Fixed**

- Increased min price tick mark step up to 1e-14 (from 1e-9) (see [#841](https://github.com/tradingview/lightweight-charts/issues/841))
- Fix typo in customization docs (see [#844](https://github.com/tradingview/lightweight-charts/issues/844))
- Do not paint time axis if it not visible (see [#865](https://github.com/tradingview/lightweight-charts/issues/865))
- Remove color customisation from settings.json (see [#869](https://github.com/tradingview/lightweight-charts/issues/869))

Thanks to our contributors:

- [@thanhlmm](https://github.com/thanhlmm) Thanh Le

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/22?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.6.1..v3.7.0).

## 3.6.1

**Fixed**

- In v3.6.0 there was a typo in `LasPriceAnimationMode` const enum (`Last` without `t`), which was fixed in this release. The incorrect name is still available to import and could be used in your code so no breaking change so far (see e5133cb0c50fc557182aba4011e170aaf30a5b1a)

See [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.6.0..v3.6.1).

## 3.6.0

On this day 10 years ago, 10th September 2011, the very first version of the TradingView website was deployed. To celebrate 10th anniversary we're happy to announce the new version of lightweight-charts library v3.6.0 🎉🎉🎉

**Enhancement**

- Gradient chart background color (see [#831](https://github.com/tradingview/lightweight-charts/issues/831))
- How to add buffer animation to price jump (see [#567](https://github.com/tradingview/lightweight-charts/issues/567))
- Kinetic scroll (see [#832](https://github.com/tradingview/lightweight-charts/issues/832))

**Fixed**

- Incorrect initial barSpacing when both fixRightEdge and fixLeftEdge are enabled (see [#823](https://github.com/tradingview/lightweight-charts/issues/823))
- Time axis label get cut on the edge if a fix edge option is enabled (see [#835](https://github.com/tradingview/lightweight-charts/issues/835))
- Price axis doesn't respect the width of crosshair label (see [#834](https://github.com/tradingview/lightweight-charts/issues/834))
- Fixed both timescale edges make lockVisibleTimeRangeOnResize turn wrong (see [#814](https://github.com/tradingview/lightweight-charts/issues/814))
- `Error: Value is null` error while set the data is container has 0x0 size (see [#821](https://github.com/tradingview/lightweight-charts/issues/821))

Thanks to our contributors:

- [@thanhlmm](https://github.com/thanhlmm) Thanh Le

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/21?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.5.0..v3.6.0).

## 3.5.0

**A note about rendering order of series, which might be interpret as a bug or breaking change since this release**

This is not really a breaking change, but might be interpret like that. In [#794](https://github.com/tradingview/lightweight-charts/issues/794) we've fixed the wrong order of series, thus now all series will be displayed in opposite order (they will be displayed in order of creating now; previously they were displayed in reversed order).

To fix that, just change the order of creating the series (thus instead of create series A, then series B create series B first and then series A) - see [#812](https://github.com/tradingview/lightweight-charts/issues/812).

**Fixed**

- Screenshot output missing piece on bottom right (see [#798](https://github.com/tradingview/lightweight-charts/issues/798))
- Overlapped line chart show wrong color order when hover (see [#794](https://github.com/tradingview/lightweight-charts/issues/794))
- Price line label show on both axis (see [#795](https://github.com/tradingview/lightweight-charts/issues/795))

Thanks to our contributors:

- [@thanhlmm](https://github.com/thanhlmm) Thanh Le

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/20?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.4.0..v3.5.0).

## 3.4.0

**Enhancement**

- Add option to fix right edge (see [#218](https://github.com/tradingview/lightweight-charts/issues/218))
- Drop restriction for min bar spacing value (see [#558](https://github.com/tradingview/lightweight-charts/issues/558))
- Round corners of the line-style plots (see [#731](https://github.com/tradingview/lightweight-charts/issues/731))

**Fixed**

- AutoscaleProvider documentation error (see [#773](https://github.com/tradingview/lightweight-charts/issues/773))
- Candlestick upColor and downColor is not changed on applyOptions (see [#750](https://github.com/tradingview/lightweight-charts/issues/750))
- Cleared and reset data appears at visually different location (see [#757](https://github.com/tradingview/lightweight-charts/issues/757))
- Remove unused internal method from SeriesApi (see [#768](https://github.com/tradingview/lightweight-charts/issues/768))
- Removing data for the last series doesn't actually remove the data (see [#752](https://github.com/tradingview/lightweight-charts/issues/752))
- `to` date of getVisibleRange contains partially visible data item and it's impossible to hover it (see [#624](https://github.com/tradingview/lightweight-charts/issues/624))
- series.priceFormatter().format(price) does not work (see [#790](https://github.com/tradingview/lightweight-charts/issues/790))

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/19?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.3.0..v3.4.0).

## 3.3.0

**Enhancement**

- Add type predicates for series type (see [#670](https://github.com/tradingview/lightweight-charts/issues/670))
- Create Grid instance for every pane (see [#382](https://github.com/tradingview/lightweight-charts/issues/382))
- Add possibility to chose crosshairMarker color, so it will be independent from line-series color (see [#310](https://github.com/tradingview/lightweight-charts/issues/310))
- Implement option not to shift the time scale at all when data is added with `setData` (see [#584](https://github.com/tradingview/lightweight-charts/issues/584))

**Fixed**

- Incorrect bar height when its value is more than chart's height (see [#673](https://github.com/tradingview/lightweight-charts/issues/673))
- Disabling autoScale for non-visible series (see [#687](https://github.com/tradingview/lightweight-charts/issues/687))

Thanks to our contributors:

- [@dubroff](https://github.com/dubroff)
- [@SuperPenguin](https://github.com/SuperPenguin) Andree Yosua
- [@mecm1993](https://github.com/mecm1993) Manuel Cepeda

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/17?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.2.0..v3.3.0).

## 3.2.0

**Enhancement**

- Feat/gzip friendly colors (see [#598](https://github.com/tradingview/lightweight-charts/issues/598))
- Add coordinateToLogical and logicalToCoordinate (see [#587](https://github.com/tradingview/lightweight-charts/issues/587))
- Add API to show/hide series without removing it (see [#471](https://github.com/tradingview/lightweight-charts/issues/471))
- Add run-time validation of inputs in debug mode (see [#315](https://github.com/tradingview/lightweight-charts/issues/315))
- Pixel perfect renderers fixes (see [#535](https://github.com/tradingview/lightweight-charts/issues/535))
- Add title option to createPriceLine (see [#357](https://github.com/tradingview/lightweight-charts/issues/357))

**Fixed**

- Set rightOffset and scrollToPosition async as well as setVisibleRange (see [#406](https://github.com/tradingview/lightweight-charts/issues/406))
- timeScale() changes visible range on setData() (see [#549](https://github.com/tradingview/lightweight-charts/issues/549))
- Remove chart's size restriction or make it smaller (see [#366](https://github.com/tradingview/lightweight-charts/issues/366))
- LineStyle.Dotted make no effect (see [#572](https://github.com/tradingview/lightweight-charts/issues/572))
- If priceScaleId is empty string, invalid price scale api is returned (see [#537](https://github.com/tradingview/lightweight-charts/issues/537))
- Incorrect Selection seen on long press in ios webview on chart (see [#609](https://github.com/tradingview/lightweight-charts/issues/609))
- One-point line series is invisible (see [#597](https://github.com/tradingview/lightweight-charts/issues/597))
- Empty price scale after creating series with the same price range (see [#615](https://github.com/tradingview/lightweight-charts/issues/615))

**Infra and dev env**

- Compress artifacts in graphics tests in CI (see [#145](https://github.com/tradingview/lightweight-charts/issues/145))
- Run tests against production build (see [#503](https://github.com/tradingview/lightweight-charts/issues/503))
- Add test to check code usage coverage (see [#495](https://github.com/tradingview/lightweight-charts/issues/495))
- Migrate from codechecks (see [#356](https://github.com/tradingview/lightweight-charts/issues/356))
- Updated dev deps

Thanks to our contributors:

- Andree Yosua [@SuperPenguin](https://github.com/SuperPenguin)
- Christos [@christose](https://github.com/christose)
- Shergin Rodion [@beholderrk](https://github.com/beholderrk)
- wenhoujx [@wenhoujx](https://github.com/wenhoujx)

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/11?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.1.5..v3.2.0).

## 3.1.5

It's a just re-published accidentally published 3.1.4 version, which didn't actually fix the issue [#536](https://github.com/tradingview/lightweight-charts/issues/536).

Version 3.1.4 has been deprecated.

**Fixed**

- TypeError `_internal_priceScale is not a function` while getting series price scale (see [#536](https://github.com/tradingview/lightweight-charts/issues/536))

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/16?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.1.3..v3.1.5).

## 3.1.3

**Fixed**

- `handleScroll` and `handleScale` options aren't applied (see [#527](https://github.com/tradingview/lightweight-charts/issues/527))

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/14?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.1.2..v3.1.3).

## 3.1.2

**Fixed**

- Crosshair doesn't work on touch devices (see [#511](https://github.com/tradingview/lightweight-charts/issues/511))

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/13?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.1.1..v3.1.2).

## 3.1.1

**Fixed**

- Fixed production build of 3.1 version (see [#502](https://github.com/tradingview/lightweight-charts/issues/502) and [62aa93724e40fbb1b678d9b44655279a1df529c5](https://github.com/tradingview/lightweight-charts/commit/62aa93724e40fbb1b678d9b44655279a1df529c5))

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/12?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.1.0..v3.1.1).

## 3.1.0

**Enhancement**

- Whitespaces support (see [#209](https://github.com/tradingview/lightweight-charts/issues/209))
- Custom font families for watermarks (see [#437](https://github.com/tradingview/lightweight-charts/issues/437))

**Fixed**

- Added support for 'transparent' color (see [#491](https://github.com/tradingview/lightweight-charts/issues/491))
- Refactor DataLayer/ChartApi (see [#270](https://github.com/tradingview/lightweight-charts/issues/270))
- Remove series then scroll to right after not working (see [#355](https://github.com/tradingview/lightweight-charts/issues/355))
- Scaling via mouse click and drag doesn't work if chart is inside shadow root (see [#427](https://github.com/tradingview/lightweight-charts/issues/427))
- Applying watermark in setTimeout doesn't make an effect (see [#485](https://github.com/tradingview/lightweight-charts/issues/485))
- Importing the library in server-side context caused `ReferenceError` (see [#446](https://github.com/tradingview/lightweight-charts/issues/446))

**Undocumented breaking changes**

We know that some of users probably used some hacky-workarounds calling internal methods to achieve multi-pane support. In this release, to reduce size of the bundle we [dropped out a code for pane's separator](https://github.com/tradingview/lightweight-charts/pull/496) (which allows to resize panes).

As soon this workaround is undocumented and we don't support this feature yet - we don't bump a major version. But we think it's better to let you know that it has been changed.

**Development**

- Dropped support NodeJS < 12.18
- Migrated from TSLint to ESLint (see [#314](https://github.com/tradingview/lightweight-charts/issues/314))
- Migrated from clean-publish to in-house script to clear package.json (see [#474](https://github.com/tradingview/lightweight-charts/issues/474))

Thanks to our contributors:

- Meet Mangukiya [@meetmangukiya](https://github.com/meetmangukiya)
- NekitCorp [@NekitCorp](https://github.com/NekitCorp)

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/9?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.0.1..v3.1.0).

## 3.0.1

**Fixed**

- Correctly handle `overlay: true` in series options while create series to backward compat (see [#475](https://github.com/tradingview/lightweight-charts/issues/475))

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/10?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v3.0.0..v3.0.1).

## 3.0.0

**Breaking changes**

We have some breaking changes since the latest version due some features and API improvements:

- Methods `subscribeVisibleTimeRangeChange` and `unsubscribeVisibleTimeRangeChange` has been moved from ChartApi to TimeScaleApi
- Since 3.0 you can specify price axis you'd like to place the series on. The same for moving the series between price scales (see migration guide below)

See [breaking changes doc](https://github.com/tradingview/lightweight-charts/blob/master/docs/3.0-breaking-changes.md) with migration guide to migrate smoothly.

**Enhancement**

- Added ability to customize time scale tick marks formatter (see [#226](https://github.com/tradingview/lightweight-charts/issues/226))
- Added ability to put text for series markers (see [#207](https://github.com/tradingview/lightweight-charts/issues/207))
- Added ability to specify your own date formatter (see [#368](https://github.com/tradingview/lightweight-charts/issues/368))
- Improved tick marks generation algorithm for the first point (see [#387](https://github.com/tradingview/lightweight-charts/issues/387))
- Made inbound types weakly (outbound ones should be strict) (see [#374](https://github.com/tradingview/lightweight-charts/issues/374))
- Removed non-exported const enum's JS code (see [#432](https://github.com/tradingview/lightweight-charts/issues/432))
- Introduced [ts-transformer-properties-rename](https://github.com/timocov/ts-transformer-properties-rename) instead of [ts-transformer-minify-privates](https://github.com/timocov/ts-transformer-minify-privates) (see [#436](https://github.com/tradingview/lightweight-charts/issues/436))

**Added**

- Add ability to override series' autoscale range (see [#392](https://github.com/tradingview/lightweight-charts/issues/392))
- Add API to get price scale's width (see [#452](https://github.com/tradingview/lightweight-charts/issues/452))
- Disabling/enabling scaling axis for both price and time (see [#440](https://github.com/tradingview/lightweight-charts/issues/440))
- Get screen coordinate by a time point (see [#435](https://github.com/tradingview/lightweight-charts/issues/435))
- Remove tick mark from price label (see [#378](https://github.com/tradingview/lightweight-charts/issues/378))
- Support the second price axis (see [#129](https://github.com/tradingview/lightweight-charts/issues/129))
- Visible time range should have bars count of the space from left/right (see [#335](https://github.com/tradingview/lightweight-charts/issues/335))

**Fixed**

- `series.setMarkers` requires at least one data point (see [#372](https://github.com/tradingview/lightweight-charts/issues/372))
- Impossible to override the only width or height in constructor (see [#353](https://github.com/tradingview/lightweight-charts/issues/353))
- Incorrect alignment of markers if series has gaps (see [#464](https://github.com/tradingview/lightweight-charts/issues/464))
- Multiple series: error while trying to scroll the chart (see [#373](https://github.com/tradingview/lightweight-charts/issues/373))
- Replace const enums with enums to let use them in projects with enabled isolatedModules option (see [#375](https://github.com/tradingview/lightweight-charts/issues/375))

Thanks to our contributors:

- Ben Guidarelli [@barnjamin](https://github.com/barnjamin)
- gkaindl [@gkaindl](https://github.com/gkaindl)
- scrwdrv [@scrwdrv](https://github.com/scrwdrv)
- Yusuf Sahin HAMZA [@yusufsahinhamza](https://github.com/yusufsahinhamza)

See [issues assigned to this version's milestone](https://github.com/tradingview/lightweight-charts/milestone/7?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v2.0.0..v3.0.0).

## 2.0.0

**Breaking changes**

- Removed unused `lineWidth` property from `HistogramStyleOptions` interface (it affects nothing, but could break your compilation)
- Changed order of `width` and `height` args in `resize` method ([#157](https://github.com/tradingview/lightweight-charts/issues/157))
- Pattern for all non-solid (dotted, dashed, large dashed and sparse dotted) line styles was a bit changed ([#274](https://github.com/tradingview/lightweight-charts/issues/274))

**Enhancement**

- Pixel-perfect rendering ([#274](https://github.com/tradingview/lightweight-charts/issues/274))
- Time scale enhancements ([#352](https://github.com/tradingview/lightweight-charts/issues/352))

**Added**

- Disable all kinds of scrolls and touch with one option ([#230](https://github.com/tradingview/lightweight-charts/issues/230))
- Added to the acceptable date formats ([#296](https://github.com/tradingview/lightweight-charts/issues/296))
- Add option to show the "global" last value of the series instead of the last visible ([#203](https://github.com/tradingview/lightweight-charts/issues/203))

**Fixed**

- Price line didn`t hightlight price ([#273](https://github.com/tradingview/lightweight-charts/issues/273))
- CreatePriceLine not removed ([#285](https://github.com/tradingview/lightweight-charts/issues/285))
- Crosshair line not visible when priceScale position set to none ([#302](https://github.com/tradingview/lightweight-charts/issues/302))
- chart.resize parameter is inverted ([#157](https://github.com/tradingview/lightweight-charts/issues/157))
- Removed unnecessary spacing from left/right (1 bar from each side) in `fitContent` ([#345](https://github.com/tradingview/lightweight-charts/issues/345))

Thanks to our contributors:

- Andree Yosua [@SuperPenguin](https://github.com/SuperPenguin)
- kpaape [@kpaape](https://github.com/kpaape)
- Matt Conway [@RetWolf](https://github.com/RetWolf)

See [issues assigned to this version’s milestone](https://github.com/tradingview/lightweight-charts/milestone/6?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v1.2.2..v2.0.0).

## 1.2.2

**Fixed**

- Bug while rendering few datasets with not equal timescale ([#321](https://github.com/tradingview/lightweight-charts/issues/321))

## 1.2.1

**Added**

- Add custom price lines ([#183](https://github.com/tradingview/lightweight-charts/issues/183))
- Migrate canvas-related logic to fancy-canvas library ([#141](https://github.com/tradingview/lightweight-charts/issues/141))
- Add coordinateToPrice method to ISeriesApi ([#171](https://github.com/tradingview/lightweight-charts/issues/171))

**Fixed**

- Scrolling by price is incorrect ([#213](https://github.com/tradingview/lightweight-charts/issues/213))
- Histogram (volume) does not honor color setting (sometimes) ([#233](https://github.com/tradingview/lightweight-charts/issues/233))
- Logarithmic scaling is applied to volume ([#227](https://github.com/tradingview/lightweight-charts/issues/227))
- hoveredSeries in mouse events params is always undefined ([#190](https://github.com/tradingview/lightweight-charts/issues/190))
- `lineType` option does not work for area/line series ([#220](https://github.com/tradingview/lightweight-charts/issues/220))
- Double clicking on time scale will reset fix left edge ([#224](https://github.com/tradingview/lightweight-charts/issues/224))
- Series' marker does not aligned after autoscale ([#212](https://github.com/tradingview/lightweight-charts/issues/212))
- Error on setData empty array for overlay histogram series ([#267](https://github.com/tradingview/lightweight-charts/issues/267))
- Added some missing docs ([#211](https://github.com/tradingview/lightweight-charts/issues/211) [#193](https://github.com/tradingview/lightweight-charts/issues/193) [#245](https://github.com/tradingview/lightweight-charts/issues/245))

See [issues assigned to this version’s milestone](https://github.com/tradingview/lightweight-charts/milestone/4?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v1.1.0...v1.2.1).

## 1.1.0

**Added**

- Apply localization to specific series ([#62](https://github.com/tradingview/lightweight-charts/issues/62))
- Series-based markers ([#24](https://github.com/tradingview/lightweight-charts/issues/24))
- Reduced size of the library by using [`ts-transformer-minify-privates`](https://github.com/timocov/ts-transformer-minify-privates) transformer ([#98](https://github.com/tradingview/lightweight-charts/issues/98))

**Fixed**

- The chart can't start from the left ([#144](https://github.com/tradingview/lightweight-charts/issues/144))
- OHLC charts render incorrect when `value` is provided ([#165](https://github.com/tradingview/lightweight-charts/issues/165))
- Price axis is not shown if series is created inside promise chain ([#164](https://github.com/tradingview/lightweight-charts/issues/164))
- The line chart can't move to the left ([#143](https://github.com/tradingview/lightweight-charts/issues/143))
- Lots of non-passive event listener warnings ([#139](https://github.com/tradingview/lightweight-charts/issues/139))
- applyOptions of histogram series with color doesn't affect the data ([#112](https://github.com/tradingview/lightweight-charts/issues/112))
- Price Axis Scaling Bug ([#122](https://github.com/tradingview/lightweight-charts/issues/122))
- LineSeries is not displayed if starting x value is out of viewport ([#116](https://github.com/tradingview/lightweight-charts/issues/116))
- Crosshair isn't updated when timescale is changed ([#120](https://github.com/tradingview/lightweight-charts/issues/120))
- Pinch isn't prevented by long tap ([#95](https://github.com/tradingview/lightweight-charts/issues/95))

Thanks to our contributors:

- zach [@n8tb1t](https://github.com/n8tb1t)
- Chris Kaczor [@krzkaczor](https://github.com/krzkaczor)

See [issues assigned to this version’s milestone](https://github.com/tradingview/lightweight-charts/milestone/2?closed=1) or [changes since the last published version](https://github.com/tradingview/lightweight-charts/compare/v1.0.2...v1.1.0).

## 1.0.2

**Fixed**

- The histogram last bar not hide in chart ([#133](https://github.com/tradingview/lightweight-charts/issues/133))

## 1.0.1

**Fixed**

- Setting the data to series fails after setting the data to histogram series with custom color ([#110](https://github.com/tradingview/lightweight-charts/issues/110))

## 1.0.0

The first release.

The docs for this version are available [here](https://github.com/tradingview/lightweight-charts/tree/v1.0.0/docs).
