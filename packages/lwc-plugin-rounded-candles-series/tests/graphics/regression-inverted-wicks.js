// Review finding 12: high/low screen coordinates reverse on invertScale.
async function runTestCase(container) {
	const t = window.PluginTest;
	const chart = t.chart(t.start(container, 'Inverted candles must retain green wicks'), { rightPriceScale: { invertScale: true } });
	const series = chart.addCustomSeries(new LwcPlugin.RoundedCandleSeries(), {
		wickColor: '#00ff00', upColor: '#444444', downColor: '#444444',
		borderVisible: false, priceLineVisible: false, lastValueVisible: false,
	});
	series.setData(t.data(8, () => ({ open: 30, high: 60, low: 10, close: 40 })));
	chart.timeScale().fitContent();
	await t.frames();
	const green = t.green(chart);
	t.check('Both wick segments are painted', green > 100, green, '> 100 green pixels');
}
