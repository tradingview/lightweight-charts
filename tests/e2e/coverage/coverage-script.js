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
	const removeChart = LightweightCharts.createChart('container');
	removeChart.remove();

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

	const candlestickSeries = chart.addCandlestickSeries({ priceScaleId: 'left', wickColor: 'blue', borderColor: 'green' });
	const candleStickData = generateBars().map((bar, index) => {
		if (index > 5) { return bar; }
		return { ...bar, color: 'orange', wickColor: 'orange', borderColor: 'orange' };
	});
	candlestickSeries.setData(candleStickData);

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

	const lineData = generateLineData();
	lineSeries.setData(generateLineData());

	const baselineSeries = chart.addBaselineSeries();
	baselineSeries.setData(generateLineData());

	baselineSeries.applyOptions({
		crosshairMarkerBorderColor: 'orange',
		crosshairMarkerBackgroundColor: 'orange',
		crosshairMarkerRadius: 6,
	});

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

	priceLine1.options();

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
	chart.timeScale().subscribeSizeChange(console.log);
	chart.subscribeCrosshairMove(console.log);
	chart.subscribeClick(console.log);

	// Calling the available methods on the chart, timeScale, and series which aren't covered elsewhere.
	chart.options();
	chart.timeScale().options();
	const logical = chart.timeScale().coordinateToLogical(300);
	chart.timeScale().logicalToCoordinate(logical);
	const time = chart.timeScale().coordinateToTime(300);
	chart.timeScale().timeToCoordinate(time);
	chart.timeScale().width();
	chart.timeScale().height();

	chart.priceScale('left').width();

	// Module exports
	console.log(LightweightCharts.TrackingModeExitMode);
	console.log(LightweightCharts.MismatchDirection);
	console.log(LightweightCharts.PriceLineSource);
	console.log(LightweightCharts.TickMarkType);
	console.log(LightweightCharts.version());

	const createdSeries = [candlestickSeries, areaSeries, lineSeries, histogramSeries, barSeries, baselineSeries];
	createdSeries.forEach(series => {
		series.options();
		series.coordinateToPrice(300);
		series.priceToCoordinate(300);
		series.priceScale();
		series.applyOptions({
			priceFormatter: a => a.toFixed(2),
		});
		series.priceFormatter();
		series.seriesType();
		series.markers();
		series.dataByIndex(10);
		series.dataByIndex(-5);
		series.dataByIndex(-5, LightweightCharts.MismatchDirection.NearestRight);
		series.dataByIndex(1500, LightweightCharts.MismatchDirection.NearestLeft);
		series.dataByIndex(1500, LightweightCharts.MismatchDirection.None);
	});

	return new Promise(resolve => {
		setTimeout(() => {
			chart.applyOptions({
				watermark: {
					fontFamily: 'Roboto',
					horzAlign: 'left',
					vertAlign: 'top',
				},
				crosshair: {
					mode: LightweightCharts.CrosshairMode.Magnet,
					vertLine: {
						labelVisible: false,
						visible: false,
					},
					horzLine: {
						labelVisible: false,
						visible: false,
					},
				},
				trackingMode: {
					exitMode: LightweightCharts.TrackingModeExitMode.OnTouchEnd,
				},
			});

			barSeries.applyOptions({ title: 'New Title' });

			lineSeries.applyOptions({ lineType: LightweightCharts.LineType.WithSteps });

			// lineseries should be a volume, therefore test the various states for the formatter.
			lineSeries.priceFormatter().format(1);
			lineSeries.priceFormatter().format(0.001);
			lineSeries.priceFormatter().format(1234);
			lineSeries.priceFormatter().format(1234567);
			lineSeries.priceFormatter().format(1234567890);

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

			chart.priceScale('right').applyOptions({
				borderVisible: true,
				ticksVisible: true,
			});

			// move series to left price scale
			lineSeries.applyOptions({ priceScaleId: 'left' });

			const lastTime = new Date(lineData[lineData.length - 1].time);
			lastTime.setUTCDate(lastTime.getUTCDate() + 1);
			lineSeries.update({
				time: lastTime,
				value: 24.11,
			});
			lastTime.setUTCDate(lastTime.getUTCDate() + 1);
			lineSeries.update({
				time: lastTime,
				value: 0.012,
			});
			lastTime.setUTCDate(lastTime.getUTCDate() + 1);
			lineSeries.update({
				time: lastTime,
				value: 1234,
			});
			lastTime.setUTCDate(lastTime.getUTCDate() + 1);
			lineSeries.update({
				time: lastTime,
				value: 1234567,
			});
			lastTime.setUTCDate(lastTime.getUTCDate() + 1);
			lineSeries.update({
				time: lastTime,
				value: 12345678912,
			});

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

			chart.timeScale().applyOptions({
				timeVisible: true,
				secondsVisible: true,
			});

			candlestickSeries.applyOptions({
				upColor: 'black',
				downColor: 'black',
				borderUpColor: 'black',
				borderDownColor: 'black',
				wickUpColor: 'black',
				wickDownColor: 'black',
			});

			setTimeout(() => {
				const pos = chart.timeScale().scrollPosition();
				chart.timeScale().scrollToPosition(pos - 20, false);
				chart.timeScale().scrollToPosition(pos, true);

				lineSeries.applyOptions({ lineType: LightweightCharts.LineType.Curved });

				chart.applyOptions({
					watermark: {
						horzAlign: 'right',
						vertAlign: 'bottom',
					},
					layout: {
						background: {
							type: LightweightCharts.ColorType.Solid,
							color: 'transparent',
						},
					},
					crosshair: {
						vertLine: {
							labelVisible: true,
							visible: true,
						},
						horzLine: {
							labelVisible: true,
							visible: true,
						},
					},
				});

				chart.applyOptions({
					layout: {
						fontFamily: undefined,
					},
					timeScale: {
						barSpacing: 12,
						minBarSpacing: 2,
						rightOffset: 4,
						fixRightEdge: true,
						fixLeftEdge: true,
					},
				});

				chart.priceScale('right').applyOptions({
					borderVisible: false,
					ticksVisible: false,
					mode: LightweightCharts.PriceScaleMode.Logarithmic,
				});

				areaSeries.coordinateToPrice(10);
				areaSeries.priceToCoordinate(200);

				setTimeout(() => {
					chart.timeScale().resetTimeScale();
					chart.timeScale().unsubscribeVisibleTimeRangeChange(console.log);
					chart.timeScale().unsubscribeVisibleLogicalRangeChange(console.log);
					chart.timeScale().unsubscribeSizeChange(console.log);
					chart.unsubscribeCrosshairMove(console.log);
					chart.unsubscribeClick(console.log);

					resolve(() => chart.remove());
				}, 1000);
			}, 500);
		}, 500);
	});
}
