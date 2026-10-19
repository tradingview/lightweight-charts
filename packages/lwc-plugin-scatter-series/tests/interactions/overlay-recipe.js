// The README recipe "Draw your own overlays" (regionShading), used as the
// README uses it, on a chart the user can scroll and zoom. Its four quadrants
// are shaded where they belong, open ends running to the edges of the pane,
// under the grid and the points, as soon as the primitive is attached; they
// follow a real wheel zoom and an inverted price scale, are cleared while the
// series is hidden and come back with it, and are gone once detached.
async function beforeInteractions(container) {
	// The README recipe, as JavaScript: the same code without its types. Keep it
	// in step with README.md ("Draw your own overlays") and with
	// tests/type-checks/overlay-recipe.ts, which type-checks the TypeScript.
	function regionShading(scatter, regions) {
		let boxes = [];
		const view = {
			zOrder: () => 'bottom',
			renderer: () => ({
				// Whole device pixels within the pane, so that the edges stay sharp.
				draw: target => target.useBitmapCoordinateSpace(({ context, bitmapSize, horizontalPixelRatio: h, verticalPixelRatio: v }) => {
					for (const box of boxes) {
						const left = Math.max(0, Math.round(box.left * h));
						const right = Math.min(bitmapSize.width, Math.round(box.right * h));
						const top = Math.max(0, Math.round(box.top * v));
						const bottom = Math.min(bitmapSize.height, Math.round(box.bottom * v));
						if (right > left && bottom > top) {
							context.fillStyle = box.color;
							context.fillRect(left, top, right - left, bottom - top);
						}
					}
				}),
			}),
		};
		return {
			attached: ({ requestUpdate }) => requestUpdate(), // attaching does not repaint the chart
			paneViews: () => [view],
			updateAllViews: () => {
				const series = scatter.series();
				boxes = [];
				if (!series.options().visible) {
					return; // the chart draws the primitives of a hidden series too
				}
				// An open Y end runs to the top of the pane, or to the bottom of an inverted scale.
				const up = series.priceScale().options().invertScale ? Infinity : -Infinity;
				const x = (value, open) => (value === null ? open : scatter.xToCoordinate(value));
				const y = (value, open) => (value === null ? open : series.priceToCoordinate(value));
				for (const region of regions) {
					const left = x(region.xMin, -Infinity);
					const right = x(region.xMax, Infinity);
					const low = y(region.yMin, -up);
					const high = y(region.yMax, up);
					if (left !== null && right !== null && low !== null && high !== null) {
						boxes.push({ left, right, top: Math.min(low, high), bottom: Math.max(low, high), color: region.color });
					}
				}
			},
		};
	}
	// End of the recipe.

	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const pane = () => container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas');
	const pixel = (x, y) => {
		const canvas = pane();
		const ratio = canvas.width / canvas.clientWidth;
		return Array.from(canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data);
	};
	const near = (actual, expected) => expected.every((value, i) => Math.abs(actual[i] - value) <= 3);
	const expectPixel = (stage, x, y, colour, name) => {
		const actual = pixel(x, y);
		if (!near(actual, colour)) { throw new Error(`${stage}: (${x}, ${y}) should be ${name} ${colour}, got ${actual}`); }
	};

	// Opaque colours, unlike the README's, so that the samples are exact.
	const green = [0, 200, 0, 255];
	const yellow = [255, 200, 0, 255];
	const red = [255, 0, 0, 255];
	const magenta = [255, 0, 255, 255];
	const white = [255, 255, 255, 255];
	const black = [0, 0, 0, 255];
	const blue = [41, 98, 255, 255];
	const css = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;

	const chart = LwcPlugin.createScatterChart(container, {
		handleScroll: true,
		handleScale: true,
		layout: { attributionLogo: false },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
	});
	const timeScale = chart.timeScale();
	// The README's usage: a relative rotation graph's quadrants around (100, 100).
	const series = LwcPlugin.createScatterSeries(chart, {
		xRange: { min: 96, max: 104 },
		yRange: { min: 96, max: 104 },
		color: '#2962FF',
		opacity: 1,
		strokeWidth: 0,
		pointSize: 14,
	});
	// One point in every quadrant, well away from the samples near the centre.
	series.setData([
		{ id: 'leading', x: 102.5, y: 102.5 },
		{ id: 'weakening', x: 102.5, y: 97.5 },
		{ id: 'lagging', x: 97.5, y: 97.5 },
		{ id: 'improving', x: 97.5, y: 102.5 },
	]);
	await frames(3);
	const plain = series.series().priceToCoordinate(102);
	expectPixel('before the shading', series.xToCoordinate(102), plain, white, 'the background');

	const shading = regionShading(series, [
		{ xMin: 100, xMax: null, yMin: 100, yMax: null, color: css(green) }, // leading
		{ xMin: 100, xMax: null, yMin: null, yMax: 100, color: css(yellow) }, // weakening
		{ xMin: null, xMax: 100, yMin: null, yMax: 100, color: css(red) }, // lagging
		{ xMin: null, xMax: 100, yMin: 100, yMax: null, color: css(magenta) }, // improving
	]);
	series.series().attachPrimitive(shading);
	// Nothing else changes: attached() alone has the chart paint it.
	await frames(3);

	/** The centre of the quadrants, (100, 100), in pane coordinates. */
	const centre = () => ({ x: series.xToCoordinate(100), y: series.series().priceToCoordinate(100) });
	/** Every quadrant `d` pixels diagonally off the centre: right/left of X = 100, above/below Y = 100 on the screen. */
	const expectQuadrants = (stage, { above, below }, d = 20) => {
		const { x, y } = centre();
		expectPixel(`${stage}, right above`, x + d, y - d, above.right[0], above.right[1]);
		expectPixel(`${stage}, left above`, x - d, y - d, above.left[0], above.left[1]);
		expectPixel(`${stage}, right below`, x + d, y + d, below.right[0], below.right[1]);
		expectPixel(`${stage}, left below`, x - d, y + d, below.left[0], below.left[1]);
		// Each quadrant ends at the centre: a pixel off it on the other side is the neighbour.
		expectPixel(`${stage}, just right of X = 100`, x + 2, y - d, above.right[0], above.right[1]);
		expectPixel(`${stage}, just left of X = 100`, x - 2, y - d, above.left[0], above.left[1]);
		expectPixel(`${stage}, just above Y = 100`, x + d, y - 2, above.right[0], above.right[1]);
		expectPixel(`${stage}, just below Y = 100`, x + d, y + 2, below.right[0], below.right[1]);
	};
	const upright = {
		above: { right: [green, 'leading'], left: [magenta, 'improving'] },
		below: { right: [yellow, 'weakening'], left: [red, 'lagging'] },
	};
	const flipped = {
		above: { right: [yellow, 'weakening'], left: [red, 'lagging'] },
		below: { right: [green, 'leading'], left: [magenta, 'improving'] },
	};
	const blank = {
		above: { right: [white, 'the background'], left: [white, 'the background'] },
		below: { right: [white, 'the background'], left: [white, 'the background'] },
	};

	expectQuadrants('attached', upright);
	// Open ends run to the edges of the pane.
	const width = timeScale.width();
	const height = pane().clientHeight;
	expectPixel('the top right corner', width - 2, 1, green, 'leading');
	expectPixel('the bottom right corner', width - 2, height - 2, yellow, 'weakening');
	expectPixel('the bottom left corner', 1, height - 2, red, 'lagging');
	expectPixel('the top left corner', 1, 1, magenta, 'improving');

	// Under the points: a point in the leading quadrant is drawn over it.
	const leading = series.pointById('leading');
	expectPixel('a point', leading.x, leading.y, blue, 'the point');
	expectPixel('next to the point', leading.x + leading.radius + 3, leading.y, green, 'leading');

	// Under the grid: a black horizontal grid line crosses the shading.
	chart.applyOptions({ grid: { horzLines: { visible: true, color: '#000000', style: LightweightCharts.LineStyle.Solid } } });
	await frames(2);
	const column = centre().x + 20;
	let gridRows = 0;
	for (let row = 2; row < centre().y - 2; row++) {
		const actual = pixel(column, row);
		if (near(actual, black)) {
			gridRows++;
		} else if (!near(actual, green)) {
			throw new Error(`Under the grid: (${column}, ${row}) should be the grid or leading, got ${actual}`);
		}
	}
	if (gridRows === 0) { throw new Error('Under the grid: no grid line is drawn over the leading quadrant'); }
	chart.applyOptions({ grid: { horzLines: { visible: false } } });
	await frames(2);

	// A real wheel zoom (1 % a step), around a point a quarter of the way across the pane.
	const fitted = { centre: centre(), spacing: timeScale.options().barSpacing };
	const anchor = { x: Math.round(width / 4), y: Math.round(fitted.centre.y) };
	window.initialInteractionsToPerform = () => [
		{ action: 'moveMouseXY', target: 'pane', options: anchor },
		...Array.from({ length: 40 }, () => ({ action: 'scrollUp' })),
	];
	window.afterInitialInteractions = async () => {
		await frames(3);
		const zoomed = centre();
		const spacing = timeScale.options().barSpacing;
		if (!(spacing > fitted.spacing * 1.2)) {
			throw new Error(`The wheel did not zoom in: ${fitted.spacing} → ${spacing} px a slot`);
		}
		if (!(zoomed.x > fitted.centre.x + 30) || !(zoomed.x < width - 40)) {
			throw new Error(`Unexpected zoom: X = 100 at ${zoomed.x}, ${fitted.centre.x} fitted, of ${width}`);
		}
		expectQuadrants('zoomed', upright);

		// An inverted price scale: the leading and improving quadrants are now below Y = 100.
		series.series().priceScale().applyOptions({ invertScale: true });
		await frames(3);
		expectQuadrants('inverted', flipped);
		expectPixel('inverted, the bottom right corner', width - 2, height - 2, green, 'leading');
		expectPixel('inverted, the top left corner', 1, 1, red, 'lagging');
		series.series().priceScale().applyOptions({ invertScale: false });
		await frames(3);
		expectQuadrants('upright again', upright);

		// Cleared while the series is hidden, back with it.
		series.applyOptions({ visible: false });
		await frames(3);
		expectQuadrants('series hidden', blank);
		expectPixel('series hidden, the top right corner', width - 2, 1, white, 'the background');
		series.applyOptions({ visible: true });
		await frames(3);
		expectQuadrants('series shown again', upright);

		// Detached: gone, while the points stay.
		series.series().detachPrimitive(shading);
		await frames(3);
		expectQuadrants('detached', blank);
		expectPixel('detached, the top right corner', width - 2, 1, white, 'the background');
		// The lagging point, left of the zoom's anchor, is still in view.
		const point = series.pointById('lagging');
		expectPixel('detached, a point', point.x, point.y, blue, 'the point');
	};
}
