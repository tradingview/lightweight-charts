---
id: android
description: You can use Lightweight Charts inside an Android application. To use Lightweight Charts in that context, you can use our Android wrapper, which will allow you to interact with lightweight charts library, which will be rendered in a web view.
keywords:
    - charts
    - android
    - canvas
    - charting library
    - charting 
    - html5 charts
    - financial charting library
sidebar_position: 7
---

# Android wrapper

:::note
You can find the source code of the Lightweight Charts Android wrapper in [this repository](https://github.com/tradingview/lightweight-charts-android).
:::

You can use Lightweight Charts inside an Android application. To use Lightweight Charts in that context, you can use our Android wrapper, which will allow you to interact with lightweight charts library, which will be rendered in a web view.

## Installation

:::info
Requires minSdkVersion 21, and installed WebView with support of ES6
:::

In `/build.gradle`

```groovy
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

In `/gradle_module/build.gradle`

```groovy
dependencies {
    //...
    implementation 'com.tradingview:lightweightcharts:3.8.0'
}
```

## Usage

Add view to the layout.

```xml
<androidx.constraintlayout.widget.ConstraintLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent">

        <com.tradingview.lightweightcharts.view.ChartsView
            android:id="@+id/charts_view"
            android:layout_width="0dp"
            android:layout_height="0dp"
            app:layout_constraintBottom_toBottomOf="parent"
            app:layout_constraintLeft_toLeftOf="parent"
            app:layout_constraintRight_toRightOf="parent"
            app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

Configure the chart layout.

```kotlin
charts_view.api.applyOptions {
    layout = layoutOptions {
        background = SolidColor(Color.LTGRAY)
        textColor = Color.BLACK.toIntColor()
    }
    localization = localizationOptions {
        locale = "ru-RU"
        priceFormatter = PriceFormatter(template = "{price:#2:#3}$")
        timeFormatter = TimeFormatter(
            locale = "ru-RU",
            dateTimeFormat = DateTimeFormat.DATE_TIME
        )
    }
}
```

Add any series to the chart and store a reference to it.

```kotlin
lateinit var histogramSeries: SeriesApi
charts_view.api.addHistogramSeries(
    onSeriesCreated = { series ->
        histogramSeries = series
    }
)
```

Add data to the series.

```kotlin
val data = listOf(
    HistogramData(Time.BusinessDay(2019, 6, 11), 40.01f),
    HistogramData(Time.BusinessDay(2019, 6, 12), 52.38f),
    HistogramData(Time.BusinessDay(2019, 6, 13), 36.30f),
    HistogramData(Time.BusinessDay(2019, 6, 14), 34.48f),
    WhitespaceData(Time.BusinessDay(2019, 6, 15)),
    WhitespaceData(Time.BusinessDay(2019, 6, 16)),
    HistogramData(Time.BusinessDay(2019, 6, 17), 41.50f),
    HistogramData(Time.BusinessDay(2019, 6, 18), 34.82f)
)
histogramSeries.setData(data)
```

## How to run the provided example

The [GitHub repository](https://github.com/tradingview/lightweight-charts-android) for lightweight-charts-android contains an example of the library in action.
You can run the example (LighweightCharts.app) by cloning the repository and opening it in Android Studio. You will need to have [NodeJS/NPM](https://nodejs.org/) installed.
