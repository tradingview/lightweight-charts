# Inverted Price Scale

This example shows how to invert a price scale. Usually, the price scale will
map the range of numbers from small to large along the vertical axis from bottom
to top. Inverting the price scale will change this such that the values map from
top to bottom.

## How to

Set the [`invertScale`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceScaleOptions#invertscale) property
on the [priceScale options](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceScaleOptions) to `true`.

```js
chart.applyOptions({
    rightPriceScale: {
        invertScale: true,
    },
});

// or (for a specific price scale)
const priceScale = chart.priceScale('right');
priceScale.applyOptions({
    invertScale: true,
});
```

You can see a full [working example](#full-example) below.

## Resources
- [invertScale](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceScaleOptions#invertscale)
- [Price Scales](https://tradingview.github.io/lightweight-charts/docs/price-scale.md) - General introduction to Price Scales.

## Full example

```js
const chartOptions = {
	layout: {
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
};
const chart = createChart(document.getElementById('container'), chartOptions);

chart.applyOptions({
	rightPriceScale: {
		scaleMargins: {
			top: 0.1,
			bottom: 0.1,
		},
		invertScale: true,
	},
});

const lineSeries = chart.addSeries(LineSeries, { color: '#2962FF' });

const data = [
	{ time: '2016-07-18', value: 661.47 },
	{ time: '2016-07-25', value: 623.83 },
	{ time: '2016-08-01', value: 592.47 },
	{ time: '2016-08-08', value: 568.76 },
	{ time: '2016-08-15', value: 577.55 },
	{ time: '2016-08-22', value: 573.20 },
	{ time: '2016-08-29', value: 603.72 },
	{ time: '2016-09-05', value: 606.32 },
	{ time: '2016-09-12', value: 608.00 },
	{ time: '2016-09-19', value: 598.98 },
	{ time: '2016-09-26', value: 608.60 },
	{ time: '2016-10-03', value: 613.06 },
	{ time: '2016-10-10', value: 638.97 },
	{ time: '2016-10-17', value: 648.74 },
	{ time: '2016-10-24', value: 697.23 },
	{ time: '2016-10-31', value: 709.93 },
	{ time: '2016-11-07', value: 700.38 },
	{ time: '2016-11-14', value: 727.09 },
	{ time: '2016-11-21', value: 727.32 },
	{ time: '2016-11-28', value: 762.00 },
	{ time: '2016-12-05', value: 768.97 },
	{ time: '2016-12-12', value: 788.67 },
	{ time: '2016-12-19', value: 890.67 },
	{ time: '2016-12-26', value: 997.75 },
	{ time: '2017-01-02', value: 909.75 },
	{ time: '2017-01-09', value: 821.86 },
	{ time: '2017-01-16', value: 923.76 },
	{ time: '2017-01-23', value: 912.01 },
	{ time: '2017-01-30', value: 1011.07 },
	{ time: '2017-02-06', value: 1000.73 },
	{ time: '2017-02-13', value: 1051.80 },
	{ time: '2017-02-20', value: 1179.05 },
	{ time: '2017-02-27', value: 1273.00 },
	{ time: '2017-03-06', value: 1226.62 },
	{ time: '2017-03-13', value: 1017.97 },
	{ time: '2017-03-20', value: 960.00 },
	{ time: '2017-03-27', value: 1078.01 },
	{ time: '2017-04-03', value: 1206.20 },
	{ time: '2017-04-10', value: 1162.31 },
	{ time: '2017-04-17', value: 1241.99 },
	{ time: '2017-04-24', value: 1350.21 },
	{ time: '2017-05-01', value: 1554.01 },
	{ time: '2017-05-08', value: 1784.00 },
	{ time: '2017-05-15', value: 2017.55 },
	{ time: '2017-05-22', value: 2178.81 },
	{ time: '2017-05-29', value: 2530.27 },
	{ time: '2017-06-05', value: 2954.22 },
	{ time: '2017-06-12', value: 2516.98 },
	{ time: '2017-06-19', value: 2502.03 },
	{ time: '2017-06-26', value: 2504.37 },
	{ time: '2017-07-03', value: 2502.28 },
	{ time: '2017-07-10', value: 1917.63 },
	{ time: '2017-07-17', value: 2749.02 },
	{ time: '2017-07-24', value: 2742.37 },
	{ time: '2017-07-31', value: 3222.75 },
	{ time: '2017-08-07', value: 4053.87 },
	{ time: '2017-08-14', value: 4058.68 },
	{ time: '2017-08-21', value: 4337.68 },
	{ time: '2017-08-28', value: 4606.26 },
	{ time: '2017-09-04', value: 4226.22 },
	{ time: '2017-09-11', value: 3662.99 },
	{ time: '2017-09-18', value: 3664.22 },
	{ time: '2017-09-25', value: 4377.22 },
	{ time: '2017-10-02', value: 4597.98 },
	{ time: '2017-10-09', value: 5679.70 },
	{ time: '2017-10-16', value: 5969.00 },
	{ time: '2017-10-23', value: 6137.37 },
	{ time: '2017-10-30', value: 7372.72 },
	{ time: '2017-11-06', value: 5870.37 },
	{ time: '2017-11-13', value: 8016.58 },
	{ time: '2017-11-20', value: 9271.06 },
	{ time: '2017-11-27', value: 11250.00 },
	{ time: '2017-12-04', value: 14691.00 },
	{ time: '2017-12-11', value: 18953.00 },
	{ time: '2017-12-18', value: 14157.87 },
	{ time: '2017-12-25', value: 13880.00 },
	{ time: '2018-01-01', value: 16124.02 },
	{ time: '2018-01-08', value: 13647.99 },
	{ time: '2018-01-15', value: 11558.87 },
	{ time: '2018-01-22', value: 11685.58 },
	{ time: '2018-01-29', value: 8191.00 },
	{ time: '2018-02-05', value: 8067.00 },
	{ time: '2018-02-12', value: 10421.06 },
	{ time: '2018-02-19', value: 9590.04 },
	{ time: '2018-02-26', value: 11463.27 },
	{ time: '2018-03-05', value: 9535.04 },
	{ time: '2018-03-12', value: 8188.24 },
	{ time: '2018-03-19', value: 8453.90 },
	{ time: '2018-03-26', value: 6813.52 },
	{ time: '2018-04-02', value: 7027.26 },
	{ time: '2018-04-09', value: 8354.22 },
	{ time: '2018-04-16', value: 8789.96 },
	{ time: '2018-04-23', value: 9393.99 },
	{ time: '2018-04-30', value: 9623.54 },
	{ time: '2018-05-07', value: 8696.58 },
	{ time: '2018-05-14', value: 8518.48 },
	{ time: '2018-05-21', value: 7347.39 },
	{ time: '2018-05-28', value: 7703.67 },
	{ time: '2018-06-04', value: 6781.17 },
	{ time: '2018-06-11', value: 6453.41 },
	{ time: '2018-06-18', value: 6153.40 },
	{ time: '2018-06-25', value: 6349.99 },
	{ time: '2018-07-02', value: 6706.60 },
	{ time: '2018-07-09', value: 6349.30 },
	{ time: '2018-07-16', value: 7396.60 },
	{ time: '2018-07-23', value: 8216.74 },
	{ time: '2018-07-30', value: 7032.61 },
	{ time: '2018-08-06', value: 6310.82 },
	{ time: '2018-08-13', value: 6481.99 },
	{ time: '2018-08-20', value: 6700.46 },
	{ time: '2018-08-27', value: 7290.31 },
	{ time: '2018-09-03', value: 6236.04 },
	{ time: '2018-09-10', value: 6499.98 },
	{ time: '2018-09-17', value: 6702.22 },
	{ time: '2018-09-24', value: 6597.81 },
	{ time: '2018-10-01', value: 6577.63 },
	{ time: '2018-10-08', value: 6183.00 },
	{ time: '2018-10-15', value: 6413.38 },
	{ time: '2018-10-22', value: 6405.57 },
	{ time: '2018-10-29', value: 6421.76 },
	{ time: '2018-11-05', value: 6357.54 },
	{ time: '2018-11-12', value: 5559.26 },
	{ time: '2018-11-19', value: 3938.89 },
	{ time: '2018-11-26', value: 4102.05 },
	{ time: '2018-12-03', value: 3529.75 },
	{ time: '2018-12-10', value: 3193.78 },
	{ time: '2018-12-17', value: 3943.83 },
	{ time: '2018-12-24', value: 3835.79 },
	{ time: '2018-12-31', value: 4040.71 },
	{ time: '2019-01-07', value: 3515.95 },
	{ time: '2019-01-14', value: 3536.72 },
	{ time: '2019-01-21', value: 3533.23 },
	{ time: '2019-01-28', value: 3414.82 },
	{ time: '2019-02-04', value: 3650.37 },
	{ time: '2019-02-11', value: 3625.60 },
	{ time: '2019-02-18', value: 3730.68 },
	{ time: '2019-02-25', value: 3789.52 },
	{ time: '2019-03-04', value: 3897.92 },
	{ time: '2019-03-11', value: 3965.50 },
	{ time: '2019-03-18', value: 3969.99 },
	{ time: '2019-03-25', value: 4096.08 },
	{ time: '2019-04-01', value: 5190.85 },
	{ time: '2019-04-08', value: 5162.72 },
	{ time: '2019-04-15', value: 5295.65 },
	{ time: '2019-04-22', value: 5160.98 },
	{ time: '2019-04-29', value: 5709.32 },
	{ time: '2019-05-06', value: 6974.35 },
	{ time: '2019-05-13', value: 8200.00 },
	{ time: '2019-05-20', value: 8733.26 },
	{ time: '2019-05-27', value: 8702.43 },
];

lineSeries.setData(data);

chart.timeScale().fitContent();
```

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
