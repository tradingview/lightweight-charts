/* global LightweightCharts */

// eslint-env browser

function generateLineData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.toISOString().slice(0, 10),
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function generateBars(count = 500, startDay = 15) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, startDay, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		const step = (i % 20) / 5000;
		const base = i / 5;

		res.push({
			time: time.getTime() / 1000,
			open: base * (1 - step),
			high: base * (1 + 2 * step),
			low: base * (1 - 2 * step),
			close: base * (1 + step),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

function generateHistogramData() {
	const colors = [
		'#013370',
		'#3a9656',
		undefined,
	];

	return generateLineData().map((item, index) => ({
		...item,
		color: colors[index % colors.length],
	}));
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	const chart = LightweightCharts.createChart(container, {
		leftPriceScale: {
			visible: true,
			mode: LightweightCharts.PriceScaleMode.Logarithmic,
		},
		rightPriceScale: {
			visible: true,
			mode: LightweightCharts.PriceScaleMode.Percentage,
		},
		timeScale: {
			timeVisible: true,
		},
		watermark: {
			visible: true,
			color: 'red',
			text: 'Watermark',
			fontSize: 24,
			fontFamily: 'Roboto',
			fontStyle: 'italic',
		},
		kineticScroll: {
			mouse: true,
		},
		layout: {
			background: {
				type: LightweightCharts.ColorType.VerticalGradient,
				topColor: '#FFFFFF',
				bottomColor: '#AAFFAA',
			},
		},
	});

	const data = generateLineData();
	const areaSeries = chart.addAreaSeries({
		priceFormat: {
			type: 'custom',
			minMove: 0.02,
			formatter: price => '$' + price.toFixed(2),
		},
	});
	areaSeries.setData(data);

	const seriesToRemove = chart.addAreaSeries({
		priceScaleId: 'overlay-id',
		priceFormat: {
			type: 'volume',
		},
		lastPriceAnimation: LightweightCharts.LastPriceAnimationMode.Continuous,
	});
	seriesToRemove.setData(generateLineData());

	const candlestickSeries = chart.addCandlestickSeries({ priceScaleId: 'left' });
	candlestickSeries.setData(generateBars());

	const barSeries = chart.addBarSeries({
		title: 'Initial title',
		priceFormat: {
			type: 'percent',
		},
	});
	barSeries.setData(generateBars());
	barSeries.applyOptions({ priceScaleId: 'left' });

	const histogramSeries = chart.addHistogramSeries({
		color: '#ff0000',
		autoscaleInfoProvider: original => original(),
	});

	histogramSeries.setData(generateHistogramData());

	const lineSeries = chart.addLineSeries({
		lineWidth: 1,
		color: '#ff0000',
		priceFormat: {
			type: 'volume',
		},
		lastPriceAnimation: LightweightCharts.LastPriceAnimationMode.OnDataUpdate,
	});

	lineSeries.setData(generateLineData());

	const baselineSeries = chart.addBaselineSeries();
	baselineSeries.setData(generateLineData());

	areaSeries.createPriceLine({
		price: 10,
		color: 'red',
		lineWidth: 1,
		lineStyle: LightweightCharts.LineStyle.Solid,
	});

	areaSeries.createPriceLine({
		price: 20,
		color: '#00FF00',
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Dotted,
	});

	areaSeries.createPriceLine({
		price: 30,
		color: 'rgb(0,0,255)',
		lineWidth: 3,
		lineStyle: LightweightCharts.LineStyle.Dashed,
	});

	const priceLineToRemove = areaSeries.createPriceLine({
		price: 40,
		color: 'rgba(255,0,0,0.5)',
		lineWidth: 4,
		lineStyle: LightweightCharts.LineStyle.LargeDashed,
	});

	const priceLine1 = areaSeries.createPriceLine({
		price: 50,
		color: '#f0f',
		lineWidth: 4,
		lineStyle: LightweightCharts.LineStyle.SparseDotted,
	});

	areaSeries.setMarkers([
		{ time: data[data.length - 7].time, position: 'belowBar', color: 'rgb(255, 0, 0)', shape: 'arrowUp', text: 'test' },
		{ time: data[data.length - 5].time, position: 'aboveBar', color: 'rgba(255, 255, 0, 1)', shape: 'arrowDown', text: 'test' },
		{ time: data[data.length - 3].time, position: 'inBar', color: '#f0f', shape: 'circle', text: 'test' },
		{ time: data[data.length - 1].time, position: 'belowBar', color: '#fff00a', shape: 'square', text: 'test', size: 2 },
	]);

	// apply overlay price scales while create series
	// time formatter

	chart.timeScale().fitContent();

	chart.timeScale().subscribeVisibleTimeRangeChange(console.log);
	chart.timeScale().subscribeVisibleLogicalRangeChange(console.log);
	chart.subscribeCrosshairMove(console.log);
	chart.subscribeClick(console.log);

	return new Promise(resolve => {
		setTimeout(() => {
			chart.timeScale().scrollToRealTime();

			chart.priceScale('overlay-id').applyOptions({});

			chart.removeSeries(seriesToRemove);
			areaSeries.removePriceLine(priceLineToRemove);

			chart.takeScreenshot();

			chart.resize(700, 700);

			chart.applyOptions({
				leftPriceScale: {
					mode: LightweightCharts.PriceScaleMode.IndexedTo100,
				},
				rightPriceScale: {
					mode: LightweightCharts.PriceScaleMode.Normal,
					invertScale: true,
					alignLabels: false,
				},
				localization: {
					dateFormat: 'yyyy MM dd',
				},
			});

			chart.priceScale('left').width();

			// move series to left price scale
			lineSeries.applyOptions({ priceScaleId: 'left' });

			// set new series data
			const newData = generateBars(520, 1);
			barSeries.setData(newData);
			barSeries.update({
				...newData[newData.length - 1],
				close: newData[newData.length - 1].close - 10,
			});
			barSeries.update({
				...newData[newData.length - 1],
				time: newData[newData.length - 1].time + 3600,
			});

			chart.timeScale().getVisibleRange();
			chart.timeScale().setVisibleRange({
				from: newData[0].time,
				to: newData[newData.length - 1].time,
			});

			barSeries.barsInLogicalRange(chart.timeScale().getVisibleLogicalRange());
			chart.timeScale().applyOptions({ fixLeftEdge: true });

			priceLine1.applyOptions({});

			setTimeout(() => {
				chart.timeScale().unsubscribeVisibleTimeRangeChange(console.log);
				chart.timeScale().unsubscribeVisibleLogicalRangeChange(console.log);
				chart.unsubscribeCrosshairMove(console.log);
				chart.unsubscribeClick(console.log);

				resolve(() => chart.remove());
			}, 500);
		}, 500);
	});
}
