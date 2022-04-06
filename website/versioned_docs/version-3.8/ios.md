---
id: ios
description: You can use Lightweight Charts inside an iOS application. To use Lightweight Charts in that context, you can use our iOS wrapper, which will allow you to interact with lightweight charts library, which will be rendered in a web view.
keywords:
    - charts
    - iOS
    - canvas
    - charting library
    - charting 
    - html5 charts
    - financial charting library
sidebar_position: 6
---

# iOS wrapper

:::note
You can find the source code of the Lightweight Charts iOS wrapper in [this repository](https://github.com/tradingview/LightweightChartsIOS).
:::

You can use Lightweight Charts inside an iOS application. To use Lightweight Charts in that context, you can use our iOS wrapper, which will allow you to interact with lightweight charts library, which will be rendered in a web view.

## Installation

:::info
Requires iOS 10.0+
:::

### CocoaPods

[CocoaPods](https://cocoapods.org) is a dependency manager for Cocoa projects. For usage and installation instructions, visit their website. To integrate LightweightCharts into your Xcode project using CocoaPods, specify it in your `Podfile`:

```ruby
pod 'LightweightCharts', '~> 3.8.0'
```

### Swift Package Manager

The [Swift Package Manager](https://swift.org/package-manager/) is a tool for automating the distribution of Swift code and is integrated into the `swift` compiler.

Once you have your Swift package set up, adding LightweightCharts as a dependency is as easy as adding it to the `dependencies` value of your `Package.swift`.

```swift
dependencies: [
    .package(url: "https://github.com/tradingview/LightweightChartsIOS", .upToNextMajor(from: "3.8.0"))
]
```

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

The [GitHub repository](https://github.com/tradingview/LightweightChartsIOS) for LightweightChartsIOS contains an example of the library in action. To run the example, start by cloning the repository, go to the _Example_ directory, and then run

```sh
pod install
```
