/*
    It is expected that 10 bars should be visible.
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
	},
	{
		time: '2019-06-01',
	},
	{
		time: '2019-06-01',
		open: 59.0,
		high: 59.27,
		low: 58.54,
		close: 58.87,
	},
	{
		time: '2019-06-02',
		open: 59.0,
		high: 59.27,
		low: 58.54,
		close: 58.87,
	},
	{
		time: '2019-06-03',
	},
	{
		time: '2019-06-03',
		open: 59.21,
		high: 59.66,
		low: 59.02,
		close: 59.57,
	},
	{
		time: '2019-06-04',
		open: 59.0,
		high: 59.27,
		low: 58.54,
		close: 58.87,
		color: 'rgb(0,0,255)',
		wickColor: 'rgb(0,0,255)',
		borderColor: 'rgb(0,0,255)',
	},
];

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		timeScale: {
			barSpacing: 12,
			shiftVisibleRangeOnNewBar: true,
			/*
                ! NOTE !
                We need to set a rightOffset to a number large enough to cover the
                amount of whitespaces we will be adding. Since adding whitespace isn't
                meant to shift the timescale, and shifting only works when the last
                bar is visible. We need to make sure that the whitespaces are visible
                so the updates are on on a visible bar.
            */
			rightOffset: 2,
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
