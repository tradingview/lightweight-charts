// Arrow markers positioned with `atPriceBottom` / `atPriceTop` and `size > 1`
// must keep their tip anchored to the requested price, not just at size 1.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));

	const line = chart.addSeries(LightweightCharts.LineSeries);
	line.setData([
		{ time: '2017-04-11', value: 80.01 },
		{ time: '2017-04-12', value: 80.01 },
		{ time: '2017-04-13', value: 80.01 },
		{ time: '2017-04-14', value: 80.01 },
		{ time: '2017-04-15', value: 80.01 },
		{ time: '2017-04-19', value: 80.01 },
		{ time: '2017-04-20', value: 80.01 },
		{ time: '2017-04-21', value: 80.01 },
		{ time: '2017-04-22', value: 80.01 },
		{ time: '2017-04-23', value: 80.01 },
	]);

	// Reference line at the exact anchor price: every arrow tip should touch it.
	line.createPriceLine({ price: 80.01, color: 'red', lineWidth: 1 });

	LightweightCharts.createSeriesMarkers(line, [
		{
			time: '2017-04-11',
			position: 'atPriceBottom',
			color: 'orange',
			shape: 'arrowUp',
			price: 80.01,
			size: 1,
		},
		{
			time: '2017-04-11',
			position: 'atPriceTop',
			color: 'green',
			shape: 'arrowDown',
			price: 80.01,
			size: 1,
		},
		{
			time: '2017-04-13',
			position: 'atPriceBottom',
			color: 'orange',
			shape: 'arrowUp',
			price: 80.01,
			size: 2,
		},
		{
			time: '2017-04-13',
			position: 'atPriceTop',
			color: 'green',
			shape: 'arrowDown',
			price: 80.01,
			size: 2,
		},
		{
			time: '2017-04-15',
			position: 'atPriceBottom',
			color: 'orange',
			shape: 'arrowUp',
			price: 80.01,
			size: 3,
		},
		{
			time: '2017-04-15',
			position: 'atPriceTop',
			color: 'green',
			shape: 'arrowDown',
			price: 80.01,
			size: 3,
		},
		{
			time: '2017-04-20',
			position: 'atPriceBottom',
			color: 'orange',
			shape: 'arrowUp',
			price: 80.01,
			size: 4,
		},
		{
			time: '2017-04-20',
			position: 'atPriceTop',
			color: 'green',
			shape: 'arrowDown',
			price: 80.01,
			size: 4,
		},
		{
			time: '2017-04-22',
			position: 'atPriceBottom',
			color: 'orange',
			shape: 'arrowUp',
			price: 80.01,
			size: 5,
		},
		{
			time: '2017-04-22',
			position: 'atPriceTop',
			color: 'green',
			shape: 'arrowDown',
			price: 80.01,
			size: 5,
		},
	]);

	chart.timeScale().fitContent();
}
