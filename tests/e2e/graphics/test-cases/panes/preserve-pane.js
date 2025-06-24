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
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const mainSeries = chart.addSeries(LightweightCharts.BarSeries);
	const secondSeries = chart.addSeries(LightweightCharts.BarSeries, {
		upColor: '#000000',
		downColor: '#000000',
	}, 1);
	const pane2 = chart.addPane(true);
	const thirdSeries = pane2.addSeries(LightweightCharts.BarSeries, {
		upColor: '#0000ff',
		downColor: '#0000ff',
	});

	const startValue = Math.floor(container.getBoundingClientRect().height / 100) * 100;

	mainSeries.setData(generateData(startValue));
	secondSeries.setData(generateData(startValue + 20));
	thirdSeries.setData(generateData(startValue + 40));
	return new Promise((resolve, reject) => {
		try {
			requestAnimationFrame(() => {
				const pane1 = chart.panes()[1];
				// so on the screenshot we can check that pane2 should be removed and pane1 should be empty with red border
				pane1.priceScale('right').applyOptions({ borderColor: 'red' });
				pane2.priceScale('right').applyOptions({ borderColor: 'blue' });
				pane1.setPreserveEmptyPane(true);
				pane2.setPreserveEmptyPane(false);
				chart.removeSeries(secondSeries);
				chart.removeSeries(thirdSeries);
				return requestAnimationFrame(resolve);
			});
		} catch (error) {
			reject(error);
		}
	});
}
