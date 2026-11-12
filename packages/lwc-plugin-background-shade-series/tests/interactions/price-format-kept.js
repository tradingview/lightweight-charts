// A shade in the same pane as a series with five decimals leaves the price
// axis formatting five decimals. On a shared scale the shade, added first,
// would set the axis format to its own two decimals, and the axis would be
// narrower than on a chart with the line alone.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const times = Array.from({ length: 20 }, (_, i) => 1704067200 + i * 86400);
	const priceFormat = { type: 'price', precision: 5, minMove: 0.00001 };
	const lineData = times.map((time, i) => ({ time, value: 1.12345 + i * 0.00011 }));

	const half = () => {
		const element = document.createElement('div');
		element.style.cssText = 'width: 600px; height: 280px;';
		container.appendChild(element);
		return element;
	};
	const alone = LightweightCharts.createChart(half());
	alone.addSeries(LightweightCharts.LineSeries, { priceFormat }).setData(lineData);

	const shaded = LightweightCharts.createChart(half());
	shaded.addCustomSeries(new LwcPlugin.BackgroundShadeSeries()).setData(times.map((time, i) => ({ time, value: i * 5 })));
	shaded.addSeries(LightweightCharts.LineSeries, { priceFormat }).setData(lineData);
	await frames();

	const expected = alone.priceScale('right').width();
	const actual = shaded.priceScale('right').width();
	if (actual !== expected) {
		throw new Error(`The price axis is ${actual} px wide next to the shade and ${expected} px without it: its format changed`);
	}
}
