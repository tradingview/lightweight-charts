function centreOffset(lineBitmapWidth) {
	return Math.floor(lineBitmapWidth * 0.5);
}

function positionsLine(positionMedia, pixelRatio, desiredWidthMedia = 1, widthIsBitmap) {
	const scaledPosition = Math.round(pixelRatio * positionMedia);
	const lineBitmapWidth = widthIsBitmap
		? desiredWidthMedia
		: Math.round(desiredWidthMedia * pixelRatio);
	const offset = centreOffset(lineBitmapWidth);
	const position = scaledPosition - offset;
	return { position, length: lineBitmapWidth };
}

function positionsBox(position1Media, position2Media, pixelRatio) {
	const scaledPosition1 = Math.round(pixelRatio * position1Media);
	const scaledPosition2 = Math.round(pixelRatio * position2Media);
	return {
		position: Math.min(scaledPosition1, scaledPosition2),
		length: Math.abs(scaledPosition2 - scaledPosition1) + 1,
	};
}

function optimalCandlestickWidth(barSpacing, pixelRatio) {
	const barSpacingSpecialCaseFrom = 2.5;
	const barSpacingSpecialCaseTo = 4;
	const barSpacingSpecialCaseCoeff = 3;
	if (
		barSpacing >= barSpacingSpecialCaseFrom &&
		barSpacing <= barSpacingSpecialCaseTo
	) {
		return Math.floor(barSpacingSpecialCaseCoeff * pixelRatio);
	}
	const barSpacingReducingCoeff = 0.2;
	const coeff =
		1 -
		(barSpacingReducingCoeff *
			Math.atan(
				Math.max(barSpacingSpecialCaseTo, barSpacing) - barSpacingSpecialCaseTo
			)) /
			(Math.PI * 0.5);
	const res = Math.floor(barSpacing * coeff * pixelRatio);
	const scaledBarSpacing = Math.floor(barSpacing * pixelRatio);
	const optimal = Math.min(res, scaledBarSpacing);
	return Math.max(Math.floor(pixelRatio), optimal);
}

function candlestickWidth(barSpacing, horizontalPixelRatio) {
	let width = optimalCandlestickWidth(barSpacing, horizontalPixelRatio);
	if (width >= 2) {
		const wickWidth = Math.floor(horizontalPixelRatio);
		if (wickWidth % 2 !== width % 2) {
			width--;
		}
	}
	return width;
}

function gridAndCrosshairMediaWidth(horizontalPixelRatio) {
	return Math.max(1, Math.floor(horizontalPixelRatio)) / horizontalPixelRatio;
}

class WhiskerBoxSeriesRenderer {
	constructor() {
		this._data = null;
		this._options = null;
	}

	draw(target, priceConverter) {
		target.useMediaCoordinateSpace(scope =>
			this._drawImpl(scope, priceConverter)
		);
	}

	update(data, options) {
		this._data = data;
		this._options = options;
	}

	// eslint-disable-next-line complexity
	_drawImpl(renderingScope, priceToCoordinate) {
		if (
			this._data === null ||
			this._data.bars.length === 0 ||
			this._data.visibleRange === null ||
			this._options === null
		) {
			return;
		}
		const options = this._options;

		// Build an index-aligned processed array (no lookups by x, no extra arrays in hot path)
		const srcBars = this._data.bars;
		const processedBars = new Array(srcBars.length);
		for (let i = 0; i < srcBars.length; i++) {
			const b = srcBars[i];
			const d = b.originalData; // raw OR conflated custom data is always here
			if (!d || !Array.isArray(d.quartiles) || d.quartiles.length < 5) {
				processedBars[i] = null; // whitespace or invalid
				continue;
			}
			// Convert prices → y coords (avoid creating extra arrays where possible)
			const q = d.quartiles;
			const qy0 = Math.round(priceToCoordinate(q[0]) ?? 0);
			const qy1 = Math.round(priceToCoordinate(q[1]) ?? 0);
			const qy2 = Math.round(priceToCoordinate(q[2]) ?? 0);
			const qy3 = Math.round(priceToCoordinate(q[3]) ?? 0);
			const qy4 = Math.round(priceToCoordinate(q[4]) ?? 0);
			const outs = d.outliers ?? [];
			const outYs = new Array(outs.length);
			for (let j = 0; j < outs.length; j++) {
				outYs[j] = Math.round(priceToCoordinate(outs[j]) ?? 0);
			}
			processedBars[i] = {
				quartilesY: [qy0, qy1, qy2, qy3, qy4],
				outliers: outYs,
				x: b.x,
			};
		}

		const widths = desiredWidths(this._data.barSpacing);

		renderingScope.context.save();
		for (
			let i = this._data.visibleRange.from;
			i < this._data.visibleRange.to;
			i++
		) {
			const processedBar = processedBars[i];
			if (processedBar === null) {
				continue;
			}

			this._drawOutliers(
				renderingScope.context,
				processedBar,
				widths.outlierRadius,
				options
			);
			this._drawWhisker(
				renderingScope.context,
				processedBar,
				widths.extremeLines,
				options
			);
			this._drawBox(renderingScope.context, processedBar, widths.body, options);
			this._drawMedianLine(
				renderingScope.context,
				processedBar,
				widths.medianLine,
				options
			);
		}
		renderingScope.context.restore();
	}

	_drawWhisker(ctx, bar, extremeLineWidth, options) {
		ctx.save();
		ctx.lineWidth = 1;
		ctx.strokeStyle = options.whiskerColor;
		ctx.beginPath();
		ctx.moveTo(bar.x, bar.quartilesY[0]);
		ctx.lineTo(bar.x, bar.quartilesY[1]);
		ctx.moveTo(bar.x, bar.quartilesY[3]);
		ctx.lineTo(bar.x, bar.quartilesY[4]);

		ctx.moveTo(bar.x - extremeLineWidth, bar.quartilesY[0]);
		ctx.lineTo(bar.x + extremeLineWidth, bar.quartilesY[0]);
		ctx.moveTo(bar.x - extremeLineWidth, bar.quartilesY[4]);
		ctx.lineTo(bar.x + extremeLineWidth, bar.quartilesY[4]);
		ctx.stroke();
		ctx.restore();
	}

	_drawBox(ctx, bar, bodyWidth, options) {
		ctx.save();
		ctx.fillStyle = options.lowerQuartileFill;
		ctx.fillRect(
			bar.x - bodyWidth,
			bar.quartilesY[1],
			bodyWidth * 2,
			bar.quartilesY[2] - bar.quartilesY[1]
		);
		ctx.fillStyle = options.upperQuartileFill;
		ctx.fillRect(
			bar.x - bodyWidth,
			bar.quartilesY[2],
			bodyWidth * 2,
			bar.quartilesY[3] - bar.quartilesY[2]
		);
		ctx.restore();
	}

	_drawMedianLine(ctx, bar, medianLineWidth, options) {
		ctx.save();
		ctx.lineWidth = 1;
		ctx.strokeStyle = options.whiskerColor;
		ctx.beginPath();
		ctx.moveTo(bar.x - medianLineWidth, bar.quartilesY[2]);
		ctx.lineTo(bar.x + medianLineWidth, bar.quartilesY[2]);
		ctx.stroke();
		ctx.restore();
	}

	_drawOutliers(ctx, bar, extremeLineWidth, options) {
		ctx.save();
		ctx.fillStyle = options.outlierColor;
		ctx.lineWidth = 0;
		bar.outliers.forEach(outlier => {
			ctx.beginPath();
			ctx.arc(bar.x, outlier, extremeLineWidth, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();
		});
		ctx.restore();
	}
}

function determinePadding(halfWidth) {
	if (halfWidth < 2) {
		return 0;
	}
	if (halfWidth < 5) {
		return 1;
	}
	return Math.ceil(halfWidth / 3);
}

function determineBodyWidth(remainingWidth) {
	if (remainingWidth < 1) {
		return 0.5;
	}
	return remainingWidth;
}

function determineLineWidths(bodyWidth) {
	if (bodyWidth < 1) {
		return 0;
	}
	if (bodyWidth <= 3) {
		return bodyWidth;
	}
	return Math.ceil(bodyWidth / 2);
}

function determineMedianWidth(bodyWidth) {
	if (bodyWidth < 1) {
		return 0;
	}
	if (bodyWidth < 4) {
		return bodyWidth;
	}
	return bodyWidth + 2;
}

function determineOutlierRadius(lineWidth) {
	if (lineWidth > 6) {
		return 6;
	}
	if (lineWidth < 1) {
		return 0;
	}
	return lineWidth;
}

function desiredWidths(barSpacing) {
	const widthExcludingWhisker = barSpacing - 1;
	const halfWidth = Math.floor(widthExcludingWhisker / 2);

	const padding = determinePadding(halfWidth);
	const bodyWidth = determineBodyWidth(halfWidth - padding);
	const medianWidth = determineMedianWidth(bodyWidth);
	const lineWidth = determineLineWidths(bodyWidth);
	const outlierRadius = determineOutlierRadius(bodyWidth);

	return {
		body: Math.ceil(bodyWidth),
		medianLine: Math.round(medianWidth),
		extremeLines: Math.round(lineWidth),
		outlierRadius: Math.floor(outlierRadius),
	};
}

const whiskerDefaultOptions = {
	...LightweightCharts.customSeriesDefaultOptions,
	whiskerColor: '#456599',
	lowerQuartileFill: '#846ED4',
	upperQuartileFill: '#C44760',
	outlierColor: '#777777',
};

class WhiskerBoxSeries {
	constructor() {
		this._renderer = new WhiskerBoxSeriesRenderer();
	}

	priceValueBuilder(datum) {
		// high, low, "close" surrogate
		return [datum.quartiles[4], datum.quartiles[0], datum.quartiles[2]];
	}

	isWhitespace(data) {
		return data.quartiles === undefined;
	}

	renderer() {
		return this._renderer;
	}

	update(data, options) {
		this._renderer.update(data, options);
	}

	defaultOptions() {
		return whiskerDefaultOptions;
	}

	// Conflation reducer for combining two whisker boxes
	// eslint-disable-next-line complexity
	conflationReducer(item1, item2) {
		const d1 = item1.data;
		const d2 = item2.data;
		if (!d1 || !Array.isArray(d1.quartiles)) {return d2 || { quartiles: [0, 0, 0, 0, 0], time: item2.originalTime };}
		if (!d2 || !Array.isArray(d2.quartiles)) {return d1 || { quartiles: [0, 0, 0, 0, 0], time: item1.originalTime };}

		const q1 = d1.quartiles.length >= 5 ? d1.quartiles : [0, 0, 0, 0, 0];
		const q2 = d2.quartiles.length >= 5 ? d2.quartiles : [0, 0, 0, 0, 0];

		const aggregatedQuartiles = [
			q1[0] < q2[0] ? q1[0] : q2[0],
			(q1[1] + q2[1]) * 0.5,
			(q1[2] + q2[2]) * 0.5,
			(q1[3] + q2[3]) * 0.5,
			q1[4] > q2[4] ? q1[4] : q2[4],
		];

		const res = { quartiles: aggregatedQuartiles, time: item2.originalTime };
		const o1 = d1.outliers; const
			o2 = d2.outliers;
		if (o1 || o2) {
			const out = [];
			if (o1) { for (let i = 0; i < o1.length && out.length < 10; i++) {out.push(o1[i]);} }
			if (o2) { for (let i = 0; i < o2.length && out.length < 10; i++) {out.push(o2[i]);} }
			if (out.length) {res.outliers = out;}
		}
		return res;
	}
}

class RoundedCandleSeriesRenderer {
	constructor() {
		this._data = null;
		this._options = null;
	}

	draw(target, priceConverter) {
		target.useBitmapCoordinateSpace(scope =>
			this._drawImpl(scope, priceConverter)
		);
	}

	update(data, options) {
		this._data = data;
		this._options = options;
	}

	_drawImpl(renderingScope, priceToCoordinate) {
		if (
			this._data === null ||
			this._data.bars.length === 0 ||
			this._data.visibleRange === null ||
			this._options === null
		) {
			return;
		}

		let lastClose = -Infinity;
		const bars = this._data.bars.map(bar => {
			const isUp = bar.originalData.close >= lastClose;
			lastClose = bar.originalData.close ?? lastClose;
			const openY = priceToCoordinate(bar.originalData.open) ?? 0;
			const highY = priceToCoordinate(bar.originalData.high) ?? 0;
			const lowY = priceToCoordinate(bar.originalData.low) ?? 0;
			const closeY = priceToCoordinate(bar.originalData.close) ?? 0;
			return {
				openY,
				highY,
				lowY,
				closeY,
				x: bar.x,
				isUp,
			};
		});

		const radius = this._options.radius(this._data.barSpacing);
		this._drawWicks(renderingScope, bars, this._data.visibleRange);
		this._drawCandles(renderingScope, bars, this._data.visibleRange, radius);
	}

	_drawWicks(renderingScope, bars, visibleRange) {
		if (this._data === null || this._options === null) {
			return;
		}

		const {
			context: ctx,
			horizontalPixelRatio,
			verticalPixelRatio,
		} = renderingScope;

		const wickWidth = gridAndCrosshairMediaWidth(horizontalPixelRatio);

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];
			ctx.fillStyle = bar.isUp
				? this._options.wickUpColor
				: this._options.wickDownColor;

			const verticalPositions = positionsBox(bar.lowY, bar.highY, verticalPixelRatio);
			const linePositions = positionsLine(bar.x, horizontalPixelRatio, wickWidth);
			ctx.fillRect(linePositions.position, verticalPositions.position, linePositions.length, verticalPositions.length);
		}
	}

	_drawCandles(renderingScope, bars, visibleRange, radius) {
		if (this._data === null || this._options === null) {
			return;
		}

		const {
			context: ctx,
			horizontalPixelRatio,
			verticalPixelRatio,
		} = renderingScope;

		const candleBodyWidth = candlestickWidth(this._data.barSpacing, 1);

		for (let i = visibleRange.from; i < visibleRange.to; i++) {
			const bar = bars[i];

			const verticalPositions = positionsBox(Math.min(bar.openY, bar.closeY), Math.max(bar.openY, bar.closeY), verticalPixelRatio);
			const linePositions = positionsLine(bar.x, horizontalPixelRatio, candleBodyWidth);

			ctx.fillStyle = bar.isUp
				? this._options.upColor
				: this._options.downColor;

			// roundRect might need to polyfilled for older browsers
			if (ctx.roundRect) {
				ctx.beginPath();
				ctx.roundRect(linePositions.position, verticalPositions.position, linePositions.length, verticalPositions.length, radius);
				ctx.fill();
			} else {
				ctx.fillRect(linePositions.position, verticalPositions.position, linePositions.length, verticalPositions.length);
			}
		}
	}
}

const roundedCandleDefaultOptions = {
	...LightweightCharts.customSeriesDefaultOptions,
	upColor: '#26a69a',
	downColor: '#ef5350',
	wickVisible: true,
	borderVisible: true,
	borderColor: '#378658',
	borderUpColor: '#26a69a',
	borderDownColor: '#ef5350',
	wickColor: '#737375',
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
	radius: function(bs) {
		if (bs < 4) {return 0;}
		return bs / 3;
	},
};

class RoundedCandleSeries {
	constructor() {
		this._renderer = new RoundedCandleSeriesRenderer();
	}

	priceValueBuilder(datum) {
		return [datum.high, datum.low, datum.close];
	}

	isWhitespace(data) {
		return data.close === undefined;
	}

	renderer() {
		return this._renderer;
	}

	update(data, options) {
		this._renderer.update(data, options);
	}

	defaultOptions() {
		return roundedCandleDefaultOptions;
	}

	// Conflation reducer for combining two candlestick values
	conflationReducer(item1, item2) {
		const d1 = item1.data;
		const d2 = item2.data;
		if (d1 === undefined || d1.close === undefined) {
			return d2 || { open: 0, high: 0, low: 0, close: 0, time: item2.originalTime };
		}
		if (d2 === undefined || d2.close === undefined) {
			return d1 || { open: 0, high: 0, low: 0, close: 0, time: item1.originalTime };
		}

		// Aggregate OHLC values
		return {
			open: (d1.open + d2.open) * 0.5,
			high: d1.high > d2.high ? d1.high : d2.high,
			low: d1.low < d2.low ? d1.low : d2.low,
			close: (d1.close + d2.close) * 0.5,
			time: item2.originalTime,
		};
	}
}

function quartileDataPoint(q0, q1, q2, q3, q4, basePoint) {
	return [
		basePoint + q0,
		basePoint + q1,
		basePoint + q2,
		basePoint + q3,
		basePoint + q4,
	];
}

function whiskerDataSection(startDate, basePoint) {
	return [
		{ quartiles: quartileDataPoint(5, 10, 15, 20, 25, basePoint) },
		{ quartiles: quartileDataPoint(3, 8, 13, 18, 23, basePoint) },
		{
			quartiles: quartileDataPoint(2, 7, 15, 18, 22, basePoint),
			outliers: [basePoint - 3, basePoint],
		},
		{ quartiles: quartileDataPoint(4, 9, 14, 19, 24, basePoint) },
		{ quartiles: quartileDataPoint(6, 11, 16, 21, 26, basePoint) },
		{
			quartiles: quartileDataPoint(1, 6, 12, 17, 25, basePoint),
			outliers: [basePoint - 5, basePoint + 4],
		},
		{ quartiles: quartileDataPoint(3, 8, 15, 20, 28, basePoint) },
		{ quartiles: quartileDataPoint(5, 10, 14, 19, 27, basePoint) },
		{ quartiles: quartileDataPoint(2, 7, 16, 18, 23, basePoint) },
		{
			quartiles: quartileDataPoint(4, 9, 13, 20, 26, basePoint),
			outliers: [basePoint + 3],
		},
	].map((d, index) => ({
		...d,
		time: startDate + index * 60 * 1000, // Use minute intervals like other series (in milliseconds)
	}));
}

function sampleWhiskerData(count = 40, basePrice = 100) {
	const data = [];
	const sections = Math.ceil(count / 10);
	const dayMs = 24 * 60 * 60 * 1000;

	for (let section = 0; section < sections; section++) {
		const sectionData = whiskerDataSection(
			dayMs + section * 10 * 60 * 1000, // Use milliseconds like other series
			basePrice + section * 0.5 // Small progression to keep price range similar
		);
		const remaining = Math.min(10, count - section * 10);
		data.push(...sectionData.slice(0, remaining));
	}

	return data;
}

function generateLollipopData(count) {
	const data = [];
	const dayMs = 24 * 60 * 60 * 1000;
	let baseValue = 100; // Changed from 50 to 100

	for (let i = 0; i < count; i++) {
		// Use deterministic calculation
		const step = (i % 20) / 1000;
		const variation = (step - 0.005) * 4;
		baseValue = baseValue * (1 + variation);
		baseValue = Math.max(50, Math.min(200, baseValue)); // Adjusted range to 50-200

		data.push({
			time: dayMs + i * 60 * 1000, // 1-minute intervals
			value: Math.round(baseValue * 100) / 100,
		});
	}

	return data;
}

function generateCandlestickData(count) {
	const data = [];
	let basePrice = 100; // Same as other series
	const dayMs = 24 * 60 * 60 * 1000;

	for (let i = 0; i < count; i++) {
		const step = (i % 20) / 1000;
		const variation = (step - 0.01) * 2; // Reduced from 4 to 2
		const open = basePrice + variation;
		const close = open + (step - 0.005) * 1; // Reduced from 2 to 1
		const high = Math.max(open, close) + step * 1; // Reduced from 2 to 1
		const low = Math.min(open, close) - step * 1; // Reduced from 2 to 1

		data.push({
			time: dayMs + i * 60 * 1000, // 1-minute intervals
			open,
			high,
			low,
			close,
		});

		basePrice = close;
	}

	return data;
}

async function runTestCase(container) {
	const desiredBars = 8000; // Number of bars visible in chart
	const barSpacing = container.clientWidth / desiredBars;

	const chart = window.chart = LightweightCharts.createChart(container, {
		timeScale: {
			enableConflation: true,
			precomputeConflationOnInit: true,
			barSpacing: barSpacing,
			minBarSpacing: barSpacing,
		},
		layout: { attributionLogo: false },
	});

	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
		color: '#2196F3',
		title: 'Line Series',
		lineWidth: 1,
		conflationThresholdFactor: 4,
	});

	const whiskerSeries = chart.addCustomSeries(new WhiskerBoxSeries(), {
		title: 'Whisker Box Series',
		baseLineColor: '',
		priceLineVisible: false,
		lastValueVisible: false,
	});

	const roundedCandleSeries = chart.addCustomSeries(new RoundedCandleSeries(), {
		title: 'Rounded Candle Series',
		upColor: '#26a69a',
		downColor: '#ef5350',
		wickVisible: true,
	});

	const lineData = generateLollipopData(desiredBars);
	const whiskerData = sampleWhiskerData(desiredBars, 150);
	const candlestickData = generateCandlestickData(desiredBars);

	lineSeries.setData(lineData);
	whiskerSeries.setData(whiskerData);
	roundedCandleSeries.setData(candlestickData);

	chart.timeScale().fitContent();

	await new Promise(resolve => setTimeout(resolve, 1000));
}
