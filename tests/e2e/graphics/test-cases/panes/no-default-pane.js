function generateBar(i, startValue, target) {
	const step = (i % 20) / 1000;
	const base = i + startValue;
	target.open = base * (1 - step);
	target.high = base * (1 + 2 * step);
	target.low = base * (1 - 2 * step);
	target.close = base * (1 + step);
}

function generateData(startValue) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		const item = {
			time: time.getTime() / 1000,
		};
		time.setUTCDate(time.getUTCDate() + 1);

		generateBar(i, startValue, item);
		res.push(item);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { addDefaultPane: false, layout: { attributionLogo: false } });

	// eslint-disable-next-line no-unused-vars
	const pane0 = chart.addPane(true);
	const pane1 = chart.addPane(true);
	const mainSeries = pane1.addSeries(LightweightCharts.BarSeries);
	const thirdSeries = chart.addSeries(LightweightCharts.BarSeries, {}, 2);

	const startValue = Math.floor(container.getBoundingClientRect().height / 100) * 100;

	mainSeries.setData(generateData(startValue));
	thirdSeries.setData(generateData(startValue + 20));
	return new Promise((resolve, reject) => {
		try {
			requestAnimationFrame(() => requestAnimationFrame(resolve));
		} catch (error) {
			reject(error);
		}
	});
}
