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

// The HLC data sits two years to the left of a second series, and the view is
// put over that second series, so the HLC series' visible range is non-null but
// empty. The renderer used to read `bars[from]` and throw; the pane must simply
// come up without a band. `scrollToPosition` and a logical range outside the
// data are both clamped, so a second series is what makes the range empty.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const data = generateData();
	const series = chart.addCustomSeries(new LwcPlugin.HLCAreaSeries());
	series.setData(data);

	const later = chart.addSeries(LightweightCharts.LineSeries);
	later.setData(
		data.map((point, index) => ({
			time: point.time + 86400 * 730,
			value: 100 + index,
		}))
	);

	chart.timeScale().setVisibleLogicalRange({ from: 70, to: 110 });
}
