// Whisker Box Series - copied from other test
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
		{ quartiles: quartileDataPoint(0, 10, 13, 18, 20, basePoint) },
		{
			quartiles: quartileDataPoint(8, 8, 10, 20, 20, basePoint),
			outliers: [basePoint - 5, basePoint],
		},
		{ quartiles: quartileDataPoint(5, 5, 5, 15, 18, basePoint) },
		{ quartiles: quartileDataPoint(2, 3, 8, 12, 15, basePoint) },
		{
			quartiles: quartileDataPoint(0, 5, 12, 11, 18, basePoint),
			outliers: [basePoint - 5, basePoint + 25, basePoint + 30],
		},
		{ quartiles: quartileDataPoint(-10, 0, 18, 20, 20, basePoint) },
		{ quartiles: quartileDataPoint(-5, 12, 20, 23, 25, basePoint) },
		{ quartiles: quartileDataPoint(-3, 10, 22, 21, 27, basePoint) },
		{
			quartiles: quartileDataPoint(3, 8, 23, 22, 22, basePoint),
			outliers: [basePoint - 5, basePoint + 30],
		},
	].map((d, index) => ({
		...d,
		time: startDate + index * 60 * 1000, // 1 minute in milliseconds
	}));
}

function sampleWhiskerData(count, basePrice = 100) {
	const dayMs = 24 * 60 * 60 * 1000;
	const startDate = dayMs;
	const data = [];
	for (let section = 0; section < Math.ceil(count / 10); section++) {
		// Use deterministic calculation based on section index instead of random
		const variation = (section % 10) / 10;
		const sectionData = whiskerDataSection(
			startDate + section * 10 * 60 * 1000,
			basePrice + (variation - 0.5) * 10
		);
		data.push(...sectionData.slice(0, Math.min(10, count - section * 10)));
	}
	return data;
}

function determinePadding(halfWidth) {
	if (halfWidth < 2) {return 0;}
	if (halfWidth < 5) {return 1;}
	return Math.ceil(halfWidth / 3);
}

function determineBodyWidth(remainingWidth) {
	if (remainingWidth < 1) {return 0.5;}
	return remainingWidth;
}

function determineLineWidths(bodyWidth) {
	if (bodyWidth < 1) {return 0;}
	if (bodyWidth <= 3) {return bodyWidth;}
	return Math.ceil(bodyWidth / 2);
}

function determineMedianWidth(bodyWidth) {
	if (bodyWidth < 1) {return 0;}
	if (bodyWidth < 4) {return bodyWidth;}
	return bodyWidth + 2;
}

function determineOutlierRadius(lineWidth) {
	if (lineWidth > 6) {return 6;}
	if (lineWidth < 1) {return 0;}
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
		const bars = this._data.bars
			.map(bar => {
				// Skip whitespace bars
				if (!bar.originalData || !bar.originalData.quartiles || bar.originalData.wt) {
					// This is likely a whitespace bar, skip it
					return null;
				}

				// Convert quartiles to array if it's not already
				let quartilesArray = bar.originalData.quartiles;
				if (quartilesArray.map) {
					// It's already an array or has map method
					quartilesArray = Array.from(quartilesArray);
				} else if (typeof quartilesArray === 'object' && quartilesArray !== null) {
					// It's a Map or similar object, convert to array
					quartilesArray = Array.from(quartilesArray.values());
				} else {
					quartilesArray = [0, 0, 0, 0, 0];
				}

				// Ensure we have exactly 5 quartile values
				if (quartilesArray.length !== 5) {
					// Pad or truncate to 5 values
					while (quartilesArray.length < 5) { quartilesArray.push(0); }
					quartilesArray = quartilesArray.slice(0, 5);
				}

				return {
					quartilesY: quartilesArray.map(price => Math.round((priceToCoordinate(price) ?? 0))),
					outliers: (bar.originalData.outliers || []).map(price => Math.round((priceToCoordinate(price) ?? 0))),
					x: bar.x,
				};
			})
			.filter(bar => bar !== null); // Remove null entries (whitespace bars)

		const widths = desiredWidths(this._data.barSpacing);

		renderingScope.context.save();
		// Iterate through visible range, but only draw non-whitespace bars
		for (
			let i = this._data.visibleRange.from;
			i < this._data.visibleRange.to;
			i++
		) {
			const originalBar = this._data.bars[i];
			const processedBar = bars.find(bar => bar && bar.x === originalBar.x);

			// Skip if this bar was filtered out (whitespace)
			if (!processedBar) {
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

const defaultOptions = {
	whiskerColor: '#456599',
	lowerQuartileFill: '#846ED4',
	upperQuartileFill: '#C44760',
	outlierColor: '#777777',
};

class WhiskerBoxSeries {
	constructor() {
		this._renderer = new WhiskerBoxSeriesRenderer();
	}

	priceValueBuilder(plotRow) {
		// we don't consider outliers here
		// Check if this is whitespace data
		if (plotRow && plotRow.wt !== undefined) {
			// This is whitespace data, return default price values
			return [0, 0, 0];
		}

		if (!plotRow || !plotRow.quartiles || !Array.isArray(plotRow.quartiles)) {
			return [0, 0, 0]; // Default values when quartiles are missing
		}
		if (plotRow.quartiles.length < 5) {
			return [0, 0, 0]; // Default values when array is too short
		}
		return [plotRow.quartiles[4], plotRow.quartiles[0], plotRow.quartiles[2]];
	}

	isWhitespace(data) {
		// Check for whitespace data structure {wt: {if: number}}
		return !data || data.wt !== undefined || !data.quartiles || !Array.isArray(data.quartiles);
	}

	renderer() {
		return this._renderer;
	}

	update(data, options) {
		this._renderer.update(data, options);
	}

	defaultOptions() {
		return defaultOptions;
	}

	// conflation reducer - aggregates exactly 2 whisker boxes using the new 2-item interface
	// eslint-disable-next-line complexity
	conflationReducer(item1, item2) {
		const data1 = item1.data;
		const data2 = item2.data;

		// Validate input data
		if (!data1 || !data1.quartiles || !Array.isArray(data1.quartiles)) {
			return data2 || { quartiles: [0, 0, 0, 0, 0] };
		}
		if (!data2 || !data2.quartiles || !Array.isArray(data2.quartiles)) {
			return data1 || { quartiles: [0, 0, 0, 0, 0] };
		}

		// Ensure both quartile arrays have at least 5 elements
		const q1 = data1.quartiles.length >= 5 ? data1.quartiles : [0, 0, 0, 0, 0];
		const q2 = data2.quartiles.length >= 5 ? data2.quartiles : [0, 0, 0, 0, 0];

		// Aggregate quartile values from both items
		const allQ0 = [q1[0], q2[0]];
		const allQ1 = [q1[1], q2[1]];
		const allQ2 = [q1[2], q2[2]];
		const allQ3 = [q1[3], q2[3]];
		const allQ4 = [q1[4], q2[4]];
		const allOutliers = [];

		// Collect outliers from both items
		if (data1.outliers) {
			allOutliers.push(...data1.outliers);
		}
		if (data2.outliers) {
			allOutliers.push(...data2.outliers);
		}

		// Calculate averaged quartiles for the 2 items
		const averagedQuartiles = [
			Math.min(...allQ0), // Min of minimums
			allQ1.reduce((a, b) => a + b) / allQ1.length, // Average of Q1
			allQ2.reduce((a, b) => a + b) / allQ2.length, // Average of median
			allQ3.reduce((a, b) => a + b) / allQ3.length, // Average of Q3
			Math.max(...allQ4), // Max of maximums
		];

		// Create result with only the data properties (no time - time is handled separately)
		const result = {
			quartiles: Array.from(averagedQuartiles), // Force create plain array
		};

		// Keep some outliers if there are any
		if (allOutliers.length > 0) {
			// Keep a reasonable subset of outliers and ensure it's a plain array
			result.outliers = Array.from(allOutliers.slice(0, 10));
		}

		return result;
	}
}

function generateCandlestickData(count) {
	const data = [];
	let basePrice = 100;
	const dayMs = 24 * 60 * 60 * 1000;

	for (let i = 0; i < count; i++) {
		// Use deterministic calculation based on index instead of random
		const step = (i % 20) / 1000;
		const variation = (step - 0.01) * 4;
		const open = basePrice + variation;
		const close = open + (step - 0.005) * 2;
		const high = Math.max(open, close) + step * 2;
		const low = Math.min(open, close) - step * 2;

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

function generateLineData(count) {
	const data = [];
	let basePrice = 100;
	const dayMs = 24 * 60 * 60 * 1000;

	for (let i = 0; i < count; i++) {
		// Use deterministic calculation based on index instead of random
		const step = (i % 20) / 1000;
		basePrice = basePrice * (1 + (step - 0.001));
		basePrice = Math.max(50, Math.min(200, basePrice)); // Keep price in reasonable range

		data.push({
			time: dayMs + i * 60 * 1000, // 1-minute intervals
			value: Math.round(basePrice * 100) / 100,
		});
	}

	return data;
}

async function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		timeScale: {
			enableConflation: true,
			precomputeConflationOnInit: true,
			barSpacing: container.clientWidth / window.devicePixelRatio / 40000,
			minBarSpacing: container.clientWidth / 3 / 40000, // make all data visible
		},
		layout: { attributionLogo: false },
	});

	// Add built-in series
	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
		color: '#2196F3',
		title: 'Line Series',
		lineWidth: 2,
	});

	const candlestickSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
		upColor: '#26a69a',
		downColor: '#ef5350',
		borderVisible: false,
		wickUpColor: '#26a69a',
		wickDownColor: '#ef5350',
		title: 'Candlestick Series',
	});

	const whiskerSeries = chart.addCustomSeries(new WhiskerBoxSeries());

	// Generate data for each series
	const lineData = generateLineData(40000);
	const candlestickData = generateCandlestickData(40000);
	const whiskerData = sampleWhiskerData(40000, 100);

	// Set data for each series
	lineSeries.setData(lineData);
	candlestickSeries.setData(candlestickData);
	whiskerSeries.setData(whiskerData);
	chart.timeScale().fitContent();
	await new Promise(resolve => setTimeout(resolve, 1000));
}
