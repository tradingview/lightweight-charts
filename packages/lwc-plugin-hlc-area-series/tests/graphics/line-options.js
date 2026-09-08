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

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.HLCAreaSeries(), {
		highLineColor: '#2962FF',
		lowLineColor: '#FF9800',
		closeLineColor: '#000000',
		areaTopColor: 'rgba(41, 98, 255, 0.4)',
		areaBottomColor: 'rgba(255, 152, 0, 0.4)',
		highLineWidth: 4,
		lowLineWidth: 4,
		closeLineWidth: 1,
	});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
