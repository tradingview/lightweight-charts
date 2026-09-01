# iOS wrapper

:::note
You can find the source code of the Lightweight Charts™ iOS wrapper in [this repository](https://github.com/tradingview/LightweightChartsIOS).
:::

You can use Lightweight Charts™ inside an iOS application. To use Lightweight Charts™ in that context, you can use our iOS wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

## Installation

:::info
Requires iOS 15.0+, Xcode 16+, and Swift 6+.
:::

### Swift Package Manager

The [Swift Package Manager](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/) is a tool for automating the distribution of Swift code and is integrated into the `swift` compiler.

Once you have your Swift package set up, adding LightweightCharts as a dependency is as easy as adding it to the `dependencies` value of your `Package.swift`.

```swift
dependencies: [
    .package(url: "https://github.com/tradingview/LightweightChartsIOS.git", from: "5.2.0")
]
```

:::caution

CocoaPods is no longer supported. The podspec was removed in the 5.x releases, so use Swift Package Manager instead.

:::

## Usage

Once the library has been installed in your repo, you're ready to create your first chart.

First of all, in a file where you would like to create a chart, you need to import the library:

```swift
import LightweightCharts
```

Create instance of LightweightCharts, which is a subclass of UIView, and add it to your view.

```swift
var chart: LightweightCharts!

// ...
chart = LightweightCharts()
view.addSubview(chart)
// ... setup layout
```

Add any series to the chart and store a reference to it.

```swift
var series: BarSeries!

// ...
series = chart.addBarSeries(options: nil)
```

Add data to the series.

```swift
let data = [
    BarData(time: .string("2018-10-19"), open: 180.34, high: 180.99, low: 178.57, close: 179.85),
    BarData(time: .string("2018-10-22"), open: 180.82, high: 181.40, low: 177.56, close: 178.75),
    BarData(time: .string("2018-10-23"), open: 175.77, high: 179.49, low: 175.44, close: 178.53),
    BarData(time: .string("2018-10-24"), open: 178.58, high: 182.37, low: 176.31, close: 176.97),
    BarData(time: .string("2018-10-25"), open: 177.52, high: 180.50, low: 176.83, close: 179.07)
]

// ...
series.setData(data: data)
```

## How to run the provided example

The [GitHub repository](https://github.com/tradingview/LightweightChartsIOS) for LightweightChartsIOS contains an example of the library in action. To run the example, clone the repository and open the Xcode project:

```sh
open Example/LightweightCharts.xcodeproj
```

---

Documentation for Lightweight Charts™ v5.2 (latest released version).

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
