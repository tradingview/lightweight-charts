// Whisker Box Series - copied from tests/e2e/graphics/test-cases/plugins/custom-series.js

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
		time: startDate + index * 60 * 1000, // 1 minute in milliseconds (same as other series)
	}));
}

function sampleWhiskerData(count, basePrice = 100) {
	const dayMs = 24 * 60 * 60 * 1000; // Use milliseconds like other series
	const startDate = dayMs; // Start at the same time as other series (dayMs)

	// Generate data similar to the test but with the requested count
	const data = [];
	for (let section = 0; section < Math.ceil(count / 10); section++) {
		// Use much smaller increments to stay in the same range as other series
		const sectionData = whiskerDataSection(
			startDate + section * 10 * 60 * 1000, // 10 minutes in milliseconds
			basePrice + (Math.random() - 0.5) * 10 // Small random variation around base price
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
		const bars = this._data.bars.map(bar => ({
			quartilesY: bar.originalData.quartiles.map(price => Math.round((priceToCoordinate(price) ?? 0))),
			outliers: (bar.originalData.outliers || []).map(price => Math.round((priceToCoordinate(price) ?? 0))),
			x: bar.x,
		}));

		const widths = desiredWidths(this._data.barSpacing);

		renderingScope.context.save();
		for (
			let i = this._data.visibleRange.from;
			i < this._data.visibleRange.to;
			i++
		) {
			const bar = bars[i];
			this._drawOutliers(
				renderingScope.context,
				bar,
				widths.outlierRadius,
				options
			);
			this._drawWhisker(
				renderingScope.context,
				bar,
				widths.extremeLines,
				options
			);
			this._drawBox(renderingScope.context, bar, widths.body, options);
			this._drawMedianLine(
				renderingScope.context,
				bar,
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
		return [plotRow.quartiles[4], plotRow.quartiles[0], plotRow.quartiles[2]];
	}

	isWhitespace(data) {
		return (data).quartiles === undefined;
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

	// Conflation reducer - aggregates multiple whisker boxes
	conflationReducer(items) {
		if (items.length === 0) {
			throw new Error('conflationReducer called with empty items array');
		}

		if (items.length === 1) {
			return items[0].data;
		}

		// Aggregate quartile values across all items
		const allQ0 = [];
		const allQ1 = [];
		const allQ2 = [];
		const allQ3 = [];
		const allQ4 = [];
		const allOutliers = [];

		for (const item of items) {
			const data = item.data;
			allQ0.push(data.quartiles[0]);
			allQ1.push(data.quartiles[1]);
			allQ2.push(data.quartiles[2]);
			allQ3.push(data.quartiles[3]);
			allQ4.push(data.quartiles[4]);

			if (data.outliers) {
				allOutliers.push(...data.outliers);
			}
		}

		// Calculate averaged quartiles
		const averagedQuartiles = [
			Math.min(...allQ0), // Min of minimums
			allQ1.reduce((a, b) => a + b) / allQ1.length, // Average of Q1
			allQ2.reduce((a, b) => a + b) / allQ2.length, // Average of median
			allQ3.reduce((a, b) => a + b) / allQ3.length, // Average of Q3
			Math.max(...allQ4), // Max of maximums
		];

		const last = items[items.length - 1];

		// Create conflated data
		const result = {
			time: last.originalTime,
			quartiles: averagedQuartiles,
		};

		// Keep some outliers if there are any
		if (allOutliers.length > 0) {
			// Keep a reasonable subset of outliers
			result.outliers = allOutliers.slice(0, 10);
		}

		return result;
	}
}

// Export the custom series class for use in the demo
if (typeof globalThis !== 'undefined') {
	// eslint-disable-next-line no-undef
	globalThis.WhiskerBoxSeries = WhiskerBoxSeries;
	// eslint-disable-next-line no-undef
	globalThis.sampleWhiskerData = sampleWhiskerData;
}
