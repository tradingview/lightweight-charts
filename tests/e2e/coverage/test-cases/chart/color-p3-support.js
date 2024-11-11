function displayP3ToRGBA(r, g, b, a = 1) {
	const linearP3 = [r, g, b].map(val => {
		const abs = Math.abs(val);
		if (abs <= 0.04045) {
			return val / 12.92;
		}
		return Math.sign(val) * Math.pow((abs + 0.055) / 1.055, 2.4);
	});

	const p3ToXYZ = [
		[0.486570948648216, 0.265667687339784, 0.198217285240192],
		[0.228974564336137, 0.691738605302214, 0.079286829361649],
		[0.0, 0.045113381858903, 1.043944368900976],
	];

	const xyz = p3ToXYZ.map(
		row => row[0] * linearP3[0] + row[1] * linearP3[1] + row[2] * linearP3[2]
	);

	const xyzToSRGB = [
		[3.2409699419045226, -1.5373831775700939, -0.4986107602930034],
		[-0.9692436362808796, 1.8759675015077204, 0.0415550574071756],
		[0.0556300796969936, -0.2039769588889765, 1.0569715142428784],
	];

	const linearSRGB = xyzToSRGB.map(
		row => row[0] * xyz[0] + row[1] * xyz[1] + row[2] * xyz[2]
	);

	const srgb = linearSRGB.map(val => {
		const abs = Math.abs(val);
		if (abs <= 0.0031308) {
			return 12.92 * val;
		}
		return Math.sign(val) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
	});

	return [...srgb, a];
}

const displayP3Parser = color => {
	const match =
		/^color\(display-p3\s+([.\d]+)\s+([.\d]+)\s+([.\d]+)(?:\s*\/\s*([.\d]+))?\)$/.exec(
			color
		);
	if (!match) {
		return null;
	}

	const r = Number(match[1]);
	const g = Number(match[2]);
	const b = Number(match[3]);
	const a = match[4] ? Number(match[4]) : 1;

	if ([r, g, b, a].some(v => isNaN(v))) {
		return null;
	}

	return displayP3ToRGBA(r, g, b, a);
};

function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function interactionsToPerform() {
	return [];
}

function beforeInteractions(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: {
			attributionLogo: false,
			background: {
				type: 'solid',
				color: 'red',
			},
			colorSpace: 'display-p3',
			colorParsers: [displayP3Parser],
		},
	}));

	const mainSeries = chart.addSeries(LightweightCharts.AreaSeries, {
		priceFormat: {
			minMove: 1,
			precision: 0,
		},
		topColor: 'color(display-p3 1 0 0)',
		bottomColor: 'color(display-p3 1 0 0)',
		lineColor: 'color(display-p3 1 0 0)',
	});

	mainSeries.setData(generateData());
	return Promise.resolve();
}

function afterInteractions() {
	return Promise.resolve();
}
