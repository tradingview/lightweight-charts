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

window.ignoreMouseMove = true;
window.checkChartScreenshot = true;

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const startValue = Math.floor(container.getBoundingClientRect().height / 100) * 100;
	for (let paneIndex = 0; paneIndex < 4; ++paneIndex) {
		chart.addSeries(LightweightCharts.BarSeries, {}, paneIndex).setData(generateData(startValue + 20 * paneIndex));
	}

	chart.panes()[0].setVisible(false);
	chart.panes()[2].setVisible(false);

	chart.resize(600, 240, true);
}
