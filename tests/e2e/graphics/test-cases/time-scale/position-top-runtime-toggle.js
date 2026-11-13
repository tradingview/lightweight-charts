function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 30; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 10 + Math.sin(i / 3) * 5,
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

async function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		leftPriceScale: { visible: true },
		timeScale: { ticksVisible: true },
	});

	const mainSeries = chart.addSeries(LightweightCharts.LineSeries);
	const data = generateData();
	mainSeries.setData(data);

	await new Promise(resolve => setTimeout(resolve, 300));

	// toggle the position at runtime, bottom -> top
	chart.timeScale().applyOptions({ position: 'top' });

	await new Promise(resolve => setTimeout(resolve, 300));

	// add another pane after the toggle to exercise the insertion path
	const secondarySeries = chart.addSeries(LightweightCharts.HistogramSeries, {}, 1);
	secondarySeries.setData(data.map(p => ({ time: p.time, value: Math.abs(p.value - 10) })));

	chart.setCrosshairPosition(12, data[10].time, mainSeries);

	await new Promise(resolve => setTimeout(resolve, 300));
}
