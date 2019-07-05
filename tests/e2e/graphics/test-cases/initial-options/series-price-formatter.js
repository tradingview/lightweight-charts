// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container, {
		priceScale: {
			scaleMargins: {
				top: 0.1,
				bottom: 0.3,
			},
		},
	});

	var areaSeries = chart.addAreaSeries({
		priceFormatter: function(price) {
			return '\u0024' + price.toFixed(2);
		},
	});

	areaSeries.setData([
		{ time: '2018-10-19', value: 219.31 },
		{ time: '2018-10-22', value: 220.65 },
		{ time: '2018-10-23', value: 222.73 },
		{ time: '2018-10-24', value: 215.09 },
		{ time: '2018-10-25', value: 219.8 },
		{ time: '2018-10-26', value: 216.3 },
		{ time: '2018-10-29', value: 212.24 },
		{ time: '2018-10-30', value: 213.3 },
		{ time: '2018-10-31', value: 218.86 },
		{ time: '2018-11-01', value: 222.22 },
		{ time: '2018-11-02', value: 207.48 },
		{ time: '2018-11-05', value: 201.59 },
		{ time: '2018-11-06', value: 203.77 },
		{ time: '2018-11-07', value: 209.95 },
	]);

	var volumeSeries = chart.addHistogramSeries({
		priceFormat: {
			type: 'volume',
		},
		overlay: true,
		scaleMargins: {
			top: 0.8,
			bottom: 0,
		},
	});

	volumeSeries.setData([
		{ time: '2018-10-19', value: 19103293, color: 'aqua' },
		{ time: '2018-10-22', value: 21737523, color: 'aqua' },
		{ time: '2018-10-23', value: 29328713, color: 'aqua' },
		{ time: '2018-10-24', value: 37435638, color: 'aqua' },
		{ time: '2018-10-25', value: 25269995, color: 'deeppink' },
		{ time: '2018-10-26', value: 24973311, color: 'deeppink' },
		{ time: '2018-10-29', value: 22103692, color: 'aqua' },
		{ time: '2018-10-30', value: 25231199, color: 'aqua' },
		{ time: '2018-10-31', value: 24214427, color: 'deeppink' },
		{ time: '2018-11-01', value: 22533201, color: 'deeppink' },
		{ time: '2018-11-02', value: 14734412, color: 'aqua' },
		{ time: '2018-11-05', value: 12733842, color: 'aqua' },
		{ time: '2018-11-06', value: 12371207, color: 'aqua' },
		{ time: '2018-11-07', value: 14891287, color: 'aqua' },
	]);

	chart.timeScale().fitContent();
}
