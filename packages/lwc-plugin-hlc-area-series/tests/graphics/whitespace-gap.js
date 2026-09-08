function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	let close = 100;
	for (let i = 0; i < 60; ++i) {
		close += Math.sin(i / 5) * 1.5;
		if (i >= 25 && i < 30) {
			res.push({ time: time.getTime() / 1000 });
		} else if (i >= 30 && i < 35) {
			// A close with no high and no low: whitespace too, since all three
			// values are needed to draw a point.
			res.push({ time: time.getTime() / 1000, close });
		} else {
			const high = close + 3 + Math.abs(Math.cos(i / 4)) * 2;
			const low = close - 3 - Math.abs(Math.sin(i / 7)) * 2;
			res.push({ time: time.getTime() / 1000, high, low, close });
		}
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Ten whitespace points in the middle of the data: five carrying a time only,
// five carrying a time and a close. The lines and the fills break there instead
// of bridging the gap with a straight segment.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.HLCAreaSeries());
	series.setData(generateData());
	chart.timeScale().fitContent();
}
