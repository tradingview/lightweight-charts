/**
 * TEST NOTE: PNG Screenshots don't support a wide color gamut
 * therefore at the moment this test won't visually show a difference
 * between the background and the series plot.
 *
 * On a screen which supports wider gamuts then you will be able to
 * spot a color difference.
 */

/**
 * Converts a Display P3 color to RGBA (sRGB)
 * @param r - Red component in Display P3 [0-1]
 * @param g - Green component in Display P3 [0-1]
 * @param b - Blue component in Display P3 [0-1]
 * @param a - Alpha component [0-1], defaults to 1
 * @returns RGBA values in sRGB color space [0-1]
 */
function displayP3ToRGBA(r, g, b, a = 1) {
	// First convert from gamma-corrected P3 to linear-light P3
	const linearP3 = [r, g, b].map(val => {
		// Transfer function is same as sRGB
		const abs = Math.abs(val);
		if (abs <= 0.04045) {
			return val / 12.92;
		}
		return Math.sign(val) * Math.pow((abs + 0.055) / 1.055, 2.4);
	});

	// Convert from linear-light P3 to CIE XYZ D65
	// Matrix from CSS Color Level 4 specification
	const p3ToXYZ = [
		[0.486570948648216, 0.265667687339784, 0.198217285240192],
		[0.228974564336137, 0.691738605302214, 0.079286829361649],
		[0.0, 0.045113381858903, 1.043944368900976],
	];

	const xyz = p3ToXYZ.map(
		row => row[0] * linearP3[0] + row[1] * linearP3[1] + row[2] * linearP3[2]
	);

	// Convert from CIE XYZ D65 to linear-light sRGB
	// Matrix from CSS Color Level 4 specification
	const xyzToSRGB = [
		[3.2409699419045226, -1.5373831775700939, -0.4986107602930034],
		[-0.9692436362808796, 1.8759675015077204, 0.0415550574071756],
		[0.0556300796969936, -0.2039769588889765, 1.0569715142428784],
	];

	const linearSRGB = xyzToSRGB.map(
		row => row[0] * xyz[0] + row[1] * xyz[1] + row[2] * xyz[2]
	);

	// Convert from linear-light sRGB to gamma-corrected sRGB
	const srgb = linearSRGB.map(val => {
		const abs = Math.abs(val);
		if (abs <= 0.0031308) {
			return 12.92 * val;
		}
		return Math.sign(val) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
	});

	// Return RGBA values
	return [...srgb, a];
}

/**
 * Example parser for Display P3 colors in the format: color(display-p3 r g b[ / a])
 */
const displayP3Parser = color => {
	// Match color(display-p3 r g b[ / a]) format
	const match =
		/^color\(display-p3\s+([.\d]+)\s+([.\d]+)\s+([.\d]+)(?:\s*\/\s*([.\d]+))?\)$/.exec(
			color
		);
	if (!match) {
		return null;
	}

	// Parse components
	const r = Number(match[1]);
	const g = Number(match[2]);
	const b = Number(match[3]);
	const a = match[4] ? Number(match[4]) : 1;

	// Validate ranges
	if ([r, g, b, a].some(v => isNaN(v))) {
		return null;
	}

	// Convert to sRGB
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

function runTestCase(container) {
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
		topColor: 'color(display-p3 1 0 0)', /* Bright Red */
		bottomColor: 'color(display-p3 1 0 0)', /* Bright Red */
		lineColor: 'color(display-p3 1 0 0)', /* Bright Red */
	});

	mainSeries.setData(generateData());
}
