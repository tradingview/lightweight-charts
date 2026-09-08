// Review finding 7: exercise the toolkit helper through a published plugin
// and a real browser canvas, whose roundRect rejects negative radii.
async function runTestCase(container) {
	const t = window.PluginTest;
	const chart = t.chart(t.start(container, 'A thick border with small corners must render'));
	const errors = [];
	const onError = event => {
		errors.push(event.message);
		event.preventDefault();
	};
	window.addEventListener('error', onError);
	const series = chart.addCustomSeries(new LwcPlugin.StackedBarsSeries(), {
		radius: 1, segmentBorderWidth: 4, segmentBorderColor: '#000000',
		colors: ['#00ff00'], priceLineVisible: false, lastValueVisible: false,
	});
	series.setData(t.data(8, () => ({ values: [10] })));
	chart.timeScale().fitContent();
	await t.frames();
	let green = 0;
	try {
		green = t.green(chart);
	} catch (error) {
		errors.push(error.message);
	}
	t.check('Valid border options do not throw', errors.length === 0, errors, []);
	t.check('Column bodies were painted', green > 100, green, '> 100 green pixels');
}
