/*
    It is expected that 6 bars should be visible.
 */
const startData = [
	{
		time: '2019-05-23',
		open: 59.0,
		high: 59.27,
		low: 58.54,
		close: 58.87,
	},
	{
		time: '2019-05-24',
		open: 59.07,
		high: 59.36,
		low: 58.67,
		close: 59.32,
	},
	{
		time: '2019-05-28',
		open: 59.21,
		high: 59.66,
		low: 59.02,
		close: 59.57,
	},
];

const updates = [
	{
		time: '2019-05-29',
		open: 59.0,
		high: 59.27,
		low: 58.54,
		close: 58.87,
	},
	{
		time: '2019-05-29',
		open: 59.07,
		high: 59.36,
		low: 58.67,
		close: 59.32,
	},
	{
		time: '2019-05-29',
		open: 59.21,
		high: 59.66,
		low: 59.02,
		close: 59.57,
	},
	{
		time: '2019-05-30',
		open: 59.0,
		high: 59.27,
		low: 58.54,
		close: 58.87,
	},
	{
		time: '2019-05-31',
		open: 59.07,
		high: 59.36,
		low: 58.67,
		close: 59.32,
		color: 'rgb(0,0,255)',
		wickColor: 'rgb(0,0,255)',
		borderColor: 'rgb(0,0,255)',
	},
];

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		timeScale: {
			barSpacing: 18,
			shiftVisibleRangeOnNewBar: true,
		},
	}));

	const s1 = chart.addCandlestickSeries();
	s1.setData(startData);

	return new Promise(resolve => {
		let index = 0;
		const intervalId = setInterval(() => {
			s1.update(updates[index]);
			index += 1;
			if (index >= updates.length) {
				clearInterval(intervalId);
				requestAnimationFrame(resolve);
			}
		}, 10);
	});
}
