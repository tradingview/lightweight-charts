const dayLength = 24 * 60 * 60;

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
		{ quartiles: quartileDataPoint(55, 70, 80, 85, 95, basePoint) },
		{ quartiles: quartileDataPoint(50, 70, 78, 83, 90, basePoint) },
		{
			quartiles: quartileDataPoint(58, 68, 75, 85, 90, basePoint),
			outliers: [45 + basePoint, 50 + basePoint],
		},
		{ quartiles: quartileDataPoint(55, 65, 70, 80, 88, basePoint) },
		{ quartiles: quartileDataPoint(52, 63, 68, 77, 85, basePoint) },
		{
			quartiles: quartileDataPoint(50, 65, 72, 76, 88, basePoint),
			outliers: [45 + basePoint, 95 + basePoint, 100 + basePoint],
		},
		{ quartiles: quartileDataPoint(40, 60, 78, 85, 90, basePoint) },
		{ quartiles: quartileDataPoint(45, 72, 80, 88, 95, basePoint) },
		{ quartiles: quartileDataPoint(47, 70, 82, 86, 97, basePoint) },
		{
			quartiles: quartileDataPoint(53, 68, 83, 87, 92, basePoint),
			outliers: [45 + basePoint, 100 + basePoint],
		},
	].map((d, index) => ({
		...d,
		time: startDate + index * dayLength,
	}));
}

function sampleWhiskerData() {
	return [
		...whiskerDataSection(1677628800, 0),
		...whiskerDataSection(1677628800 + 1 * 10 * dayLength, 20),
		...whiskerDataSection(1677628800 + 2 * 10 * dayLength, 40),
		...whiskerDataSection(1677628800 + (3 * 10 + 1) * dayLength, 30),
	];
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

	draw(
		target,
		priceConverter
	) {
		target.useMediaCoordinateSpace(scope =>
			this._drawImpl(scope, priceConverter)
		);
	}

	update(
		data,
		options
	) {
		this._data = data;
		this._options = options;
	}

	_drawImpl(
		renderingScope,
		priceToCoordinate
	) {
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

	_drawWhisker(
		ctx,
		bar,
		extremeLineWidth,
		options
	) {
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

	_drawBox(
		ctx,
		bar,
		bodyWidth,
		options
	) {
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

	_drawMedianLine(
		ctx,
		bar,
		medianLineWidth,
		options
	) {
		ctx.save();
		ctx.lineWidth = 1;
		ctx.strokeStyle = options.whiskerColor;
		ctx.beginPath();
		ctx.moveTo(bar.x - medianLineWidth, bar.quartilesY[2]);
		ctx.lineTo(bar.x + medianLineWidth, bar.quartilesY[2]);
		ctx.stroke();
		ctx.restore();
	}

	_drawOutliers(
		ctx,
		bar,
		extremeLineWidth,
		options
	) {
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

	update(
		data,
		options
	) {
		this._renderer.update(data, options);
	}

	defaultOptions() {
		return defaultOptions;
	}
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } }));

	const customSeriesView = new WhiskerBoxSeries();
	const myCustomSeries = chart.addCustomSeries(customSeriesView, {
		baseLineColor: '',
		priceLineVisible: false,
		lastValueVisible: false,
	});

	const data = sampleWhiskerData();
	data[data.length - 2] = { time: data[data.length - 2].time }; // test whitespace data
	myCustomSeries.setData(data);

	chart.timeScale().fitContent();
}
