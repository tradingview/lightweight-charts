// A crosshair mode changed while the plugin is attached is the user's: the
// plugin leaves it in place on detach. With setCrosshairMode off, the mode is
// never touched; turning the option on sets Normal, and off again puts the
// mode back.
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const times = Array.from({ length: 60 }, (_, i) => 1704067200 + i * 86400);

function makeChart(container, options = {}) {
	return LightweightCharts.createChart(container, { layout: { attributionLogo: false }, ...options });
}

function addLineSeries(chart, paneIndex = 0, options = {}) {
	const series = chart.addSeries(LightweightCharts.LineSeries, options, paneIndex);
	series.setData(times.map((time, i) => ({ time, value: 100 + Math.sin(i / 5) * 10 })));
	return series;
}

function expect(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

async function beforeInteractions(container) {
	const { CrosshairMode } = LightweightCharts;
	const chart = makeChart(container, { crosshair: { mode: CrosshairMode.Magnet } });
	const series = addLineSeries(chart);
	const lines = new LwcPlugin.UserPriceLines();
	series.attachPrimitive(lines);
	chart.applyOptions({ crosshair: { mode: CrosshairMode.Hidden } });
	series.detachPrimitive(lines);
	expect(chart.options().crosshair.mode === CrosshairMode.Hidden, 'Detaching changed a crosshair mode the user set');

	chart.applyOptions({ crosshair: { mode: CrosshairMode.Magnet } });
	const kept = new LwcPlugin.UserPriceLines({ setCrosshairMode: false });
	series.attachPrimitive(kept);
	expect(chart.options().crosshair.mode === CrosshairMode.Magnet, 'setCrosshairMode: false changed the crosshair mode');
	kept.applyOptions({ setCrosshairMode: true });
	expect(chart.options().crosshair.mode === CrosshairMode.Normal, 'Turning setCrosshairMode on did not set Normal mode');
	kept.applyOptions({ setCrosshairMode: false });
	expect(chart.options().crosshair.mode === CrosshairMode.Magnet, 'Turning setCrosshairMode off did not put the mode back');
	series.detachPrimitive(kept);
	expect(chart.options().crosshair.mode === CrosshairMode.Magnet, 'Detaching changed the crosshair mode');
	await frames();
}
