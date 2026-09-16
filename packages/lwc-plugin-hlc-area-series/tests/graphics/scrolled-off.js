function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	let close = 100;
	for (let i = 0; i < 60; ++i) {
		close += Math.sin(i / 5) * 1.5;
		const high = close + 3 + Math.abs(Math.cos(i / 4)) * 2;
		const low = close - 3 - Math.abs(Math.sin(i / 7)) * 2;
		res.push({ time: time.getTime() / 1000, high, low, close });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Zoomed into the middle of the data, so the first and the last visible points
// are off the pane on either side. The lines and the fills have to run all the
// way to both edges: the library hands custom series the NON-extended visible
// range, so a renderer that stops at the outermost visible point leaves a wedge
// of empty pane at each side.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.HLCAreaSeries());
	series.setData(generateData());
	chart.timeScale().setVisibleLogicalRange({ from: 18.5, to: 34.5 });
}
