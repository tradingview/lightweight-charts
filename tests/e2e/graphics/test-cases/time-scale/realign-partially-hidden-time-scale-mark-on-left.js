function getData() {
	return [
		{ time: 1639037531, value: 41.162 },
		{ time: 1639040640, value: 41.366 },
		{ time: 1639040700, value: 41.37 },
		{ time: 1639040760, value: 41.372 },
		{ time: 1639040940, value: 41.341 },
		{ time: 1639041000, value: 41.334 },
		{ time: 1639041060, value: 41.325 },
		{ time: 1639041240, value: 41.337 },
		{ time: 1639041780, value: 41.368 },
		{ time: 1639042140, value: 41.388 },
		{ time: 1639042260, value: 41.364 },
		{ time: 1639042680, value: 41.36 },
		{ time: 1639042740, value: 41.365 },
		{ time: 1639042860, value: 41.338 },
		{ time: 1639042980, value: 41.35 },
		{ time: 1639043220, value: 41.361 },
		{ time: 1639043520, value: 41.344 },
		{ time: 1639043700, value: 41.357 },
		{ time: 1639043880, value: 41.345 },
		{ time: 1639043940, value: 41.34 },
		{ time: 1639044540, value: 41.342 },
		{ time: 1639045140, value: 41.312 },
		{ time: 1639045397, value: 41.357 },
		{ time: 1639045740, value: 41.346 },
		{ time: 1639045860, value: 41.355 },
		{ time: 1639046400, value: 41.35 },
		{ time: 1639046460, value: 41.345 },
		{ time: 1639047060, value: 41.355 },
		{ time: 1639047540, value: 41.339 },
		{ time: 1639047600, value: 41.352 },
		{ time: 1639047720, value: 41.354 },
		{ time: 1639047900, value: 41.324 },
		{ time: 1639048380, value: 41.3 },
		{ time: 1639048740, value: 41.267 },
		{ time: 1639048800, value: 41.266 },
		{ time: 1639049160, value: 41.276 },
		{ time: 1639049280, value: 41.276 },
		{ time: 1639049460, value: 41.31 },
		{ time: 1639049520, value: 41.314 },
		{ time: 1639049700, value: 41.314 },
		{ time: 1639049880, value: 41.328 },
		{ time: 1639050000, value: 41.318 },
		{ time: 1639050300, value: 41.334 },
		{ time: 1639050360, value: 41.33 },
		{ time: 1639050660, value: 41.328 },
		{ time: 1639050780, value: 41.32 },
		{ time: 1639051380, value: 41.312 },
		{ time: 1639051440, value: 41.326 },
		{ time: 1639051620, value: 41.327 },
		{ time: 1639051740, value: 41.315 },
		{ time: 1639051860, value: 41.3 },
		{ time: 1639051920, value: 41.292 },
		{ time: 1639052100, value: 41.265 },
		{ time: 1639052160, value: 41.266 },
		{ time: 1639052280, value: 41.279 },
		{ time: 1639052460, value: 41.296 },
		{ time: 1639052640, value: 41.28 },
		{ time: 1639052700, value: 41.287 },
		{ time: 1639052880, value: 41.312 },
		{ time: 1639053180, value: 41.312 },
		{ time: 1639053480, value: 41.291 },
		{ time: 1639053840, value: 41.276 },
		{ time: 1639054680, value: 41.282 },
		{ time: 1639054800, value: 41.297 },
		{ time: 1639054860, value: 41.304 },
	];
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		handleScale: false,
		handleScroll: false,
		timeScale: {
			timeVisible: true,
		},
	});

	const series = chart.addAreaSeries();
	const data = getData();

	series.setData(data);

	const logicalRange = chart.timeScale().getVisibleLogicalRange();
	const newLogicalRange = { from: 0, to: Math.abs(logicalRange.from) + logicalRange.to };
	chart.timeScale().setVisibleLogicalRange(newLogicalRange);
}

