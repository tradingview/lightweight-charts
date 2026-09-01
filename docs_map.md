# Lightweight Charts™ - Documentation Map

A map of all documentation pages with their headings, for navigation by LLMs and tools. Every page is available as Markdown at the linked URL.

> Version: 5.2 (latest released)
> Last updated: 2026-09-01 11:41:54 UTC

This map uses a hierarchical structure:

* `##`/`###` mark documentation groups
* `- [title](url.md)` marks a page (fetch the `.md` URL for its full content)
* Nested bullets show the heading structure within each page

## Documentation

- [Getting started](https://tradingview.github.io/lightweight-charts/docs.md)
  - Requirements
  - Installation
    - Build variants
  - AI coding assistants
  - License and attribution
  - Creating a chart
  - Creating a series
  - Setting and updating a data
    - Setting the data to a series
    - Updating the data in a series
- [Series](https://tradingview.github.io/lightweight-charts/docs/series-types.md)
  - Supported types
    - Area
    - Bar
    - Baseline
    - Candlestick
    - Histogram
    - Line
    - Custom series (plugins)
  - Customization
- [Chart types](https://tradingview.github.io/lightweight-charts/docs/chart-types.md)
  - Standard Time-based Chart
  - Yield Curve Chart
  - Options Chart (Price-based)
  - Custom Horizontal Scale Chart
  - Choosing the Right Chart Type
- [Price scale](https://tradingview.github.io/lightweight-charts/docs/price-scale.md)
  - Create price scale
  - Modify price scale
  - Remove price scale
- [Time scale](https://tradingview.github.io/lightweight-charts/docs/time-scale.md)
  - Overview
    - Time scale appearance
    - Time scale API
  - Visible range
    - Data range
    - Logical range
  - Chart margin
- [Panes](https://tradingview.github.io/lightweight-charts/docs/panes.md)
  - Customization Options
  - Managing Panes
- [Time zones](https://tradingview.github.io/lightweight-charts/docs/time-zones.md)
  - Overview
  - Approaches
    - Using pure JavaScript
    - Using the date-fns-tz library
    - Using the IANA time zone database
  - Why are time zones not supported?
- [iOS wrapper](https://tradingview.github.io/lightweight-charts/docs/ios.md)
  - Installation
    - Swift Package Manager
  - Usage
  - How to run the provided example
- [Android wrapper](https://tradingview.github.io/lightweight-charts/docs/android.md)
  - Installation
  - Usage
  - How to run the provided example
- [Release Notes](https://tradingview.github.io/lightweight-charts/docs/release-notes.md)
  - 5.2.1
  - 5.2.0
  - 5.1.0
    - Major Updates in 5.1
      - Data Conflation
  - 5.0.9
  - 5.0.8
  - 5.0.7
  - 5.0.6
  - 5.0.5
  - 5.0.4
  - 5.0.3
  - 5.0.2
  - 5.0.0
    - Major Updates in 5.0
      - Multi-Pane Support
      - New Chart Types
      - Enhanced Color Support
      - Architectural Improvements
    - Breaking Changes
    - Enhancements
    - Bug Fixes
    - Migration Guide
    - Technical Notes
  - 4.2.3
  - 4.2.2
  - 4.2.1
  - 4.2.0
  - 4.1.7
  - 4.1.6
  - 4.1.5
  - 4.1.4
  - 4.1.3
  - 4.1.2
  - 4.1.1
  - 4.1.0
  - 4.0.1
  - 4.0.0
  - 3.8.0
  - 3.7.0
  - 3.6.1
  - 3.6.0
  - 3.5.0
  - 3.4.0
  - 3.3.0
  - 3.2.0
  - 3.1.5
  - 3.1.3
  - 3.1.2
  - 3.1.1
  - 3.1.0
  - 3.0.1
  - 3.0.0
  - 2.0.0
  - 1.2.2
  - 1.2.1
  - 1.1.0
  - 1.0.2
  - 1.0.1
  - 1.0.0

### Plugins

- [Plugins](https://tradingview.github.io/lightweight-charts/docs/plugins/intro.md)
  - Custom series
  - Primitives
    - Series primitives
    - Pane primitives
- [Series Primitives](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives.md)
  - Views
    - IPrimitivePaneView
      - Interactive Demo of zOrder layers
    - ISeriesPrimitiveAxisView
  - Lifecycle Methods
    - attached
    - detached
  - Updating Views
  - Extending the Autoscale Info
- [Pane Primitives](https://tradingview.github.io/lightweight-charts/docs/plugins/pane-primitives.md)
  - Key Differences from Series Primitives
  - Adding a Pane Primitive
  - Implementing a Pane Primitive
- [Custom Series Types](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series.md)
  - Defining a Custom Series
    - Renderer
    - Update
    - Hit Testing
    - Price Value Builder
    - Whitespace
    - Default Options
    - Destroy
- [Canvas Rendering Target](https://tradingview.github.io/lightweight-charts/docs/plugins/canvas-rendering-target.md)
  - Using CanvasRenderingTarget2D
  - Difference between Bitmap and Media
    - Bitmap Coordinate Space
      - Bitmap Coordinate Space Usage
    - Media Coordinate Space
      - Media Coordinate Space Usage
  - General Tips

#### Pixel Perfect Rendering

- [Best Practices for Pixel Perfect Rendering in Canvas Drawings](https://tradingview.github.io/lightweight-charts/docs/plugins/pixel-perfect-rendering.md)
  - Centered Shapes
  - Dual Point Shapes
  - Default Widths

##### Default Widths

- [Candlestick Width Calculations](https://tradingview.github.io/lightweight-charts/docs/plugins/pixel-perfect-rendering/widths/candlestick.md)
- [Histogram Column Width Calculations](https://tradingview.github.io/lightweight-charts/docs/plugins/pixel-perfect-rendering/widths/columns.md)
- [Crosshair and Grid Line Width Calculations](https://tradingview.github.io/lightweight-charts/docs/plugins/pixel-perfect-rendering/widths/crosshair.md)
- [Full Bar Width Calculations](https://tradingview.github.io/lightweight-charts/docs/plugins/pixel-perfect-rendering/widths/full-bar-width.md)

### Migrations

- [From v2 to v3](https://tradingview.github.io/lightweight-charts/docs/migrations/from-v2-to-v3.md)
  - Time Scale API
  - Two price scales
    - Default behavior
    - Left price scale
    - No price scale
    - Creating overlay
    - Move price scale from right to left or vice versa
- [From v3 to v4](https://tradingview.github.io/lightweight-charts/docs/migrations/from-v3-to-v4.md)
  - Exported enum LasPriceAnimationMode has been removed
  - scaleMargins option has been removed from series options
  - backgroundColor from layout options has been removed
  - overlay property of series options has been removed
  - priceScale option has been removed
  - priceScale() method of chart API now requires to provide price scale id
  - drawTicks from leftPriceScale and rightPriceScale options has been renamed to ticksVisible
  - The type of outbound time values has been changed
  - seriesPrices property from MouseEventParams has been removed
  - MouseEventParams field hoveredMarkerId was renamed to hoveredObjectId
- [From v4 to v5](https://tradingview.github.io/lightweight-charts/docs/migrations/from-v4-to-v5.md)
  - Table of Contents
  - Series changes
    - Overview of Changes
    - Migration Steps
      - Before (v4)
      - After (v5)
      - Migration Reference
    - Usage Examples
  - Series Markers
    - Overview of Changes
    - Migration Steps
      - Before (v4)
      - After (v5)
    - Key Changes
  - Watermarks
    - Overview of Changes
    - Migration Steps
      - Before (v4)
      - After (v5)
    - Accessing the New TextWatermark
    - Changes in Options
    - Attaching the Watermark
    - Example: Implementing a Text Watermark
  - Plugin Typings
    - Overview of Changes

## Tutorials

- [Tutorials](https://tradingview.github.io/lightweight-charts/tutorials.md)
  - Guides
  - Framework integrations
  - How To
  - Examples / Demos
  - Analysis indicators
- [Analysis indicators](https://tradingview.github.io/lightweight-charts/tutorials/analysis-indicators.md)
  - Overview
    - Available indicators
    - Live demos
  - How to use the examples
    - Option 1: copy the source code
    - Option 2: compile the examples
  - How to add indicator
    - Helper function (recommended)
      - Example
    - Direct calculation
      - Example

### Guides


#### Customization

- [Customizing the Chart](https://tradingview.github.io/lightweight-charts/tutorials/customization/intro.md)
  - What we will be building
  - Topics to be covered
  - Prerequisite knowledge
  - Terminology
  - How to set up the example so you can follow along
- [First steps](https://tradingview.github.io/lightweight-charts/tutorials/customization/creating-a-chart.md)
  - Adding the Lightweight Charts™ script
  - Creating the chart
  - Creating some sample data
  - Adding a candlestick series
  - Automatically resizing the chart when the window is resized (Optional)
  - Result
  - Next steps
  - Download
  - Complete code
- [Chart colors](https://tradingview.github.io/lightweight-charts/tutorials/customization/chart-colors.md)
  - Setting the background color of the HTML body
  - Applying options
  - Adjusting the background and text colors for the chart
  - (Optional) Setting a desired height and width for the chart
  - Adjusting the border colors for the axes
  - Result
  - Next steps
  - Download
  - Complete code
- [Series colors](https://tradingview.github.io/lightweight-charts/tutorials/customization/series.md)
  - Setting custom colors for the candlestick series
  - Result
  - Next steps
  - Download
  - Complete code
- [Price format](https://tradingview.github.io/lightweight-charts/tutorials/customization/price-format.md)
  - Price Formatter functions
  - Setting the price formatter
  - Built-in price formatting
  - Result
  - Next steps
  - Download
  - Complete code
- [Price scale](https://tradingview.github.io/lightweight-charts/tutorials/customization/price-scale.md)
  - Adjusting settings for the price scale
  - Result
    - Before
    - After
  - Next steps
  - Download
  - Complete code
- [Time scale](https://tradingview.github.io/lightweight-charts/tutorials/customization/time-scale.md)
  - Adjusting settings for the time scale
  - Auto fitting all the content
  - Result
  - Next steps
  - Download
  - Complete code
- [Crosshair](https://tradingview.github.io/lightweight-charts/tutorials/customization/crosshair.md)
  - Crosshair mode
  - Styling the crosshair
  - Result
  - Next steps
  - Download
  - Complete code
- [Adding a second series](https://tradingview.github.io/lightweight-charts/tutorials/customization/second-series.md)
  - Preparing the data for the area series
  - Adding the area series and setting it's options
  - Visual stacking order of series
  - Result
  - Next steps
  - Download
  - Complete code
- [Data points](https://tradingview.github.io/lightweight-charts/tutorials/customization/data-points.md)
  - Result
  - Next steps
  - Download
  - Complete code
- [Finishing touches](https://tradingview.github.io/lightweight-charts/tutorials/customization/finishing-touches.md)
  - Changing the font
  - Result
  - Download
  - Complete code
- [Conclusion](https://tradingview.github.io/lightweight-charts/tutorials/customization/conclusion.md)

#### Accessibility

- [Improving accessibility](https://tradingview.github.io/lightweight-charts/tutorials/a11y/intro.md)
  - Introduction
  - What we will be building
  - Topics to be covered
  - Prerequisite knowledge
  - Terminology
- [Keyboard navigation](https://tradingview.github.io/lightweight-charts/tutorials/a11y/keyboard.md)
  - Purpose of keyboard navigation
  - Implementing keyboard actions with Lightweight Charts™
    - Setting focus on the chart
    - Adding event listener for keyboard actions
    - Utilizing Lightweight Chart's API for actions
- [Screen Readers](https://tradingview.github.io/lightweight-charts/tutorials/a11y/screenreader.md)
  - Use of ARIA attributes in the chart
    - aria-live
    - aria-label
    - aria-hidden
    - Adding the ARIA attributes to an existing chart via JavaScript
  - Generating a description of the chart
  - Semantic HTML
- [Readability](https://tradingview.github.io/lightweight-charts/tutorials/a11y/readability.md)
  - High contrast and scalable font size
    - High contrast mode
    - Scalable font size
- [Conclusion](https://tradingview.github.io/lightweight-charts/tutorials/a11y/conclusion.md)
  - Complete example

### Framework Integrations


#### React

- [Basic React example](https://tradingview.github.io/lightweight-charts/tutorials/react/simple.md)
  - Prepare your project
  - Create a charting component
  - Result
  - What's next?
- [Advanced React example](https://tradingview.github.io/lightweight-charts/tutorials/react/advanced.md)
  - Component-based architecture
  - Complete code
  - Result
  - What's next?
- [Vue.js - Wrapper Component](https://tradingview.github.io/lightweight-charts/tutorials/vuejs/wrapper.md)
  - About the example wrapper component
    - Component showcase
    - Vue API styles
  - Integrating Lightweight Charts™ with Vue
    - Avoid using Refs for storing API instances
    - Use the onMounted lifecycle hook to create the chart
    - Providing option properties
    - Exposing the chart instance or additional methods
  - Complete Sample Code
    - Composition API
    - Options API
    - Example Vue App Component
- [Web Components - Custom Element](https://tradingview.github.io/lightweight-charts/tutorials/webcomponents/custom-element.md)
  - About the example custom element
    - Component showcase
  - Creating the chart
  - Attributes and properties
    - Attributes
    - Properties
  - Accessing the chart instance or additional methods
  - Using a Custom Element
    - Standalone script example html file
  - Complete Sample Code
    - Wrapper Custom Element
    - Example Usage Custom Element

### How To

- [Custom horizontal scale](https://tradingview.github.io/lightweight-charts/tutorials/how_to/horizontal-price-scale.md)
  - Understanding the IHorzScaleBehavior interface
    - options
    - setOptions
    - preprocessData
    - updateFormatter
    - createConverterToInternalObj
    - key
    - cacheKey
    - convertHorzItemToInternal
    - formatHorzItem
    - formatTickmark
    - maxTickMarkWeight
    - fillWeightsForPoints
  - Example
    - Implement price-based horizontal scale
    - Customize horizontal scale behavior
    - Conclusion
    - Full example
- [Inverted Price Scale](https://tradingview.github.io/lightweight-charts/tutorials/how_to/inverted-price-scale.md)
  - How to
  - Resources
  - Full example
- [Legends](https://tradingview.github.io/lightweight-charts/tutorials/how_to/legends.md)
  - How to
  - Resources
  - Examples
    - Simple Legend Example
    - 3 Line Legend Example
- [Panes](https://tradingview.github.io/lightweight-charts/tutorials/how_to/panes.md)
  - How to add a pane
    - Customizations
  - Full Example
- [Price and volume on a single chart](https://tradingview.github.io/lightweight-charts/tutorials/how_to/price-and-volume.md)
  - How to add a volume histogram
  - Resources
  - Full example
- [Add Price Line](https://tradingview.github.io/lightweight-charts/tutorials/how_to/price-line.md)
  - Short answer
  - Tips
  - Resources
  - Full example
- [Add Series Markers](https://tradingview.github.io/lightweight-charts/tutorials/how_to/series-markers.md)
  - Short answer
  - Further information
  - Resources
  - Full example
- [Set crosshair position](https://tradingview.github.io/lightweight-charts/tutorials/how_to/set-crosshair-position.md)
  - Syncing two charts
  - Tracking without long-press (on mobile)
- [Tooltips](https://tradingview.github.io/lightweight-charts/tutorials/how_to/tooltips.md)
  - How to
    - Getting the mouse cursors position
    - Getting the data points position
  - Resources
  - Examples
    - Floating Tooltip
    - Tracking Tooltip
    - Magnifier Tooltip
- [Two Price Scales](https://tradingview.github.io/lightweight-charts/tutorials/how_to/two-price-scales.md)
  - Short answer
  - Tips
  - Resources
  - Full example
- [Watermark](https://tradingview.github.io/lightweight-charts/tutorials/how_to/watermark.md)
  - Short answer
  - Resources
  - Examples
    - Simple Watermark Example
    - Image Watermark Example
  - Resources

### Examples / Demos

- [Compare multiple series](https://tradingview.github.io/lightweight-charts/tutorials/demos/compare-multiple-series.md)
- [Custom font family](https://tradingview.github.io/lightweight-charts/tutorials/demos/custom-font-family.md)
    - API Reference
- [Custom locale](https://tradingview.github.io/lightweight-charts/tutorials/demos/custom-locale.md)
    - API Reference
- [Infinite history](https://tradingview.github.io/lightweight-charts/tutorials/demos/infinite-history.md)
- [Moving average indicator](https://tradingview.github.io/lightweight-charts/tutorials/demos/moving-average.md)
- [Range switcher](https://tradingview.github.io/lightweight-charts/tutorials/demos/range-switcher.md)
- [Realtime updates](https://tradingview.github.io/lightweight-charts/tutorials/demos/realtime-updates.md)
- [Whitespace data](https://tradingview.github.io/lightweight-charts/tutorials/demos/whitespace.md)
    - API Reference
- [Yield Curve Chart with Update Markers](https://tradingview.github.io/lightweight-charts/tutorials/demos/yield-curve-with-update-markers.md)

## Type Definitions

- [Lightweight Charts API (TypeScript declarations)](https://tradingview.github.io/lightweight-charts/lightweight-charts.d.ts)
