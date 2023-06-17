const sampleDataSection = [
	{
		open: 10,
		high: 11,
		low: 10,
		close: 11,
	},
	{
		open: 10.5,
		high: 10.5,
		low: 9.5,
		close: 9.5,
	},
];

function sampleData() {
	const res = [];
	const time = new Date(Date.UTC(2023, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({
			time: time.getTime() / 1000,
			...sampleDataSection[0],
		});
		time.setUTCDate(time.getUTCDate() + 1);
		res.push({
			time: time.getTime() / 1000,
			...sampleDataSection[1],
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

window.ignoreMouseMove = true;

function runTestCase(container) {
	container.style.display = 'flex';
	container.style.flexWrap = 'wrap';

	const barSpacings = [2.4, 2.5, 2.6, 2.75, 2.9, 3.0, 3.1, 3.9, 4.0];

	barSpacings.forEach((barSpacing, index) => {
		const element = document.createElement('div');
		element.style = 'width: 200px; height: 200px;';
		container.append(element);
		const chart = LightweightCharts.createChart(element, {
			rightPriceScale: {
				visible: false,
			},
			handleScale: false,
			layout: {
				background: {
					type: 'solid',
					color: index % 2 ? '#FFFFFF' : '#F8F8F8',
				},
			},
		});

		const mainSeries = chart.addCandlestickSeries({
			upColor: 'rgba(0, 255, 0, 0.5)',
			downColor: 'rgba(255, 0, 0, 0.5)',
			borderVisible: false,
		});
		mainSeries.setData(sampleData());

		chart.timeScale().applyOptions({
			barSpacing,
			visible: false,
		});
	});
}
