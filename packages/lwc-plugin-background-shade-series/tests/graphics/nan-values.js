function generateData(count = 60, low = 0, high = 100) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		const ratio = (Math.sin(i / 6) + 1) / 2;
		res.push({ time: time.getTime() / 1000, value: Math.round((low + ratio * (high - low)) * 100) / 100 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function lineData(shade) {
	return shade.map((point, index) => ({ time: point.time, value: 100 + Math.sin(index / 3) * 10 }));
}

// NaN, null and a missing value make a point whitespace: its slot stays
// unshaded, where the example reused the previous bar's color for it.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const shade = LwcPlugin.createBackgroundShadeSeries(chart);
	const data = generateData().map((point, index) => {
		if (index % 9 === 3) {
			return { time: point.time, value: NaN };
		}
		if (index % 9 === 6) {
			return { time: point.time, value: null };
		}
		return index % 9 === 8 ? { time: point.time } : point;
	});
	shade.setData(data);
	chart.addSeries(LightweightCharts.LineSeries, { color: '#131722' }).setData(lineData(generateData()));
	chart.timeScale().fitContent();
}
