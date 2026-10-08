// Drawing details measured on the canvas:
// - a baseline thinner than half a pixel is drawn one device pixel wide, not
//   in the width of the line drawn before it;
// - a hoveredOpacity which is not a number draws the hovered point opaque
//   (the default), not in the opacity of the point drawn before it;
// - a translucent plot border is as light in the corners as along the edges:
//   no corner is drawn twice;
// - a yRange given in the wrong order is swapped, as xRange is.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const chart = LwcPlugin.createScatterChart(container, {
		width: 400,
		height: 300,
		layout: { attributionLogo: false },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
	});
	const canvas = () => container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas');
	const pixel = (x, y) => {
		const ratio = canvas().width / canvas().clientWidth;
		return Array.from(canvas().getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data);
	};
	const series = LwcPlugin.createScatterSeries(chart, { opacity: 0.3, pointSize: 30, color: '#000000', strokeWidth: 0 });
	series.setData([{ id: 'a', x: 10, y: 1 }, { id: 'b', x: 50, y: 5 }, { id: 'c', x: 90, y: 9 }]);
	await frames(3);

	// Baselines: 3 px, then 0.3 px, both black, away from the points.
	series.applyOptions({
		baselines: [
			{ axis: 'y', value: 3, width: 3, color: '#000000' },
			{ axis: 'y', value: 7, width: 0.3, color: '#000000' },
		],
	});
	await frames(3);
	const ratio = canvas().width / canvas().clientWidth;
	// Between the points at 50 and 90.
	const columnAt = 0.7 * chart.timeScale().width() * ratio;
	const darkRows = value => {
		const y = Math.round(series.series().priceToCoordinate(value) * ratio);
		const column = canvas().getContext('2d').getImageData(Math.round(columnAt), y - 6, 1, 13).data;
		let dark = 0;
		for (let i = 0; i < column.length; i += 4) {
			if (column[i] < 128) {
				dark++;
			}
		}
		return dark;
	};
	if (darkRows(3) !== Math.round(3 * ratio)) { throw new Error(`The 3 px baseline is ${darkRows(3)} device pixels wide`); }
	if (darkRows(7) !== 1) { throw new Error(`A 0.3 px baseline should be one device pixel wide, it is ${darkRows(7)}`); }
	series.applyOptions({ baselines: [] });

	// The hovered point, at an opacity which is not a number: opaque.
	series.applyOptions({ hoveredOpacity: Number.NaN });
	series.setHoveredPoint('b');
	await frames(3);
	const b = series.pointById('b');
	const hovered = pixel(b.x, b.y);
	if (hovered[0] > 30) { throw new Error(`The hovered point should be drawn opaque, it is ${hovered}`); }
	const other = series.pointById('a');
	if (pixel(other.x, other.y)[0] < 100) { throw new Error('The other points should keep their opacity'); }
	series.setHoveredPoint(null);

	// A translucent border, 4 px on every side.
	series.applyOptions({ plotBorder: { visible: true, color: 'rgba(0, 0, 255, 0.5)', width: 4 } });
	await frames(3);
	const width = chart.timeScale().width();
	const height = chart.paneSize().height;
	const edge = pixel(width / 2, 1);
	for (const [x, y] of [[1, 1], [width - 2, 1], [1, height - 2], [width - 2, height - 2]]) {
		const corner = pixel(x, y);
		if (corner.some((value, i) => Math.abs(value - edge[i]) > 3)) { throw new Error(`The corner at ${x}, ${y} is ${corner}, the edge ${edge}`); }
	}
	series.applyOptions({ plotBorder: { visible: false } });

	// A reversed yRange: swapped. No scale margins, so the range spans the pane.
	chart.priceScale('right').applyOptions({ scaleMargins: { top: 0, bottom: 0 } });
	series.applyOptions({ yRange: { min: 20, max: -5 } });
	await frames(3);
	const top = series.series().coordinateToPrice(0);
	const bottom = series.series().coordinateToPrice(height);
	if (Math.abs(top - 20) > 0.5 || Math.abs(bottom + 5) > 0.5) { throw new Error(`A reversed yRange should show -5…20, it shows ${bottom}…${top}`); }
}
