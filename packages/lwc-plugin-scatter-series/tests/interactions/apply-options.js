// applyOptions re-renders and re-scales: sizeRange changes the sizes, groups
// the colours (painted), xRange the X domain and yRange the price scale; an
// open end goes back to automatic. Custom point fields survive every change.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const pixel = (x, y) => {
		const canvas = container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas');
		const ratio = canvas.width / canvas.clientWidth;
		return Array.from(canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data);
	};
	const near = (actual, expected) => expected.every((value, i) => Math.abs(actual[i] - value) <= 2);
	const close = (actual, expected, tolerance, what) => {
		if (actual === null || Math.abs(actual - expected) > tolerance) {
			throw new Error(`${what}: expected ${expected}, got ${actual}`);
		}
	};

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const series = LwcPlugin.createScatterSeries(chart, {
		opacity: 1,
		groups: [{ id: 'g', color: '#2962FF' }],
	});
	const points = [
		{ id: 'small', x: 10, y: 10, sizeValue: 0, group: 'g', title: 'Small', meta: { rank: 1 } },
		{ id: 'large', x: 50, y: 40, sizeValue: 100, group: 'g', title: 'Large', meta: { rank: 2 } },
		{ id: 'middle', x: 90, y: 70, sizeValue: 50, group: 'g', title: 'Middle', meta: { rank: 3 } },
	];
	series.setData(points);
	await frames();
	const fieldsKept = stage => {
		points.forEach((point, index) => {
			const kept = series.data()[index];
			const info = series.pointById(point.id);
			if (kept !== point || kept.title !== point.title || kept.meta.rank !== index + 1) {
				throw new Error(`${stage}: data() lost the custom fields of ${point.id}`);
			}
			if (info !== null && (info.point !== point || info.point.title !== point.title)) {
				throw new Error(`${stage}: pointById lost the custom fields of ${point.id}`);
			}
		});
	};

	// Default size range 5–25.
	close(series.pointById('small').radius, 2.5, 1e-9, 'default radius of the smallest value');
	close(series.pointById('large').radius, 12.5, 1e-9, 'default radius of the largest value');
	series.applyOptions({ sizeRange: { min: 10, max: 40 } });
	await frames();
	close(series.pointById('small').radius, 5, 1e-9, 'radius of the smallest value after sizeRange');
	close(series.pointById('large').radius, 20, 1e-9, 'radius of the largest value after sizeRange');
	close(series.pointById('middle').radius, 12.5, 1e-9, 'radius of the middle value after sizeRange');
	if (series.options().sizeRange.min !== 10 || series.options().sizeRange.max !== 40) {
		throw new Error(`options() does not report the size range: ${JSON.stringify(series.options().sizeRange)}`);
	}
	// Out-of-bounds sizes are clamped to 5–50.
	series.applyOptions({ sizeRange: { min: 1, max: 80 } });
	close(series.pointById('small').radius, 2.5, 1e-9, 'radius clamped to 5 px');
	close(series.pointById('large').radius, 25, 1e-9, 'radius clamped to 50 px');
	fieldsKept('sizeRange');

	// Groups are replaced as a whole: a new colour is painted.
	const large = series.pointById('large');
	if (!near(pixel(large.x, large.y), [41, 98, 255, 255])) { throw new Error(`The group colour is not painted: ${pixel(large.x, large.y)}`); }
	series.applyOptions({ groups: [{ id: 'g', color: '#F23645' }] });
	await frames();
	if (series.pointById('large').color !== '#F23645') { throw new Error('pointById does not report the new group colour'); }
	if (!near(pixel(large.x, large.y), [242, 54, 69, 255])) { throw new Error(`The new group colour is not painted: ${pixel(large.x, large.y)}`); }
	fieldsKept('groups');

	// A pinned X range: the ends sit on the plot edges.
	series.applyOptions({ xRange: { min: -50, max: 150 } });
	await frames();
	let domain = series.xDomain();
	if (domain.min !== -50 || domain.max !== 150) { throw new Error(`xRange is not applied: ${JSON.stringify(domain)}`); }
	const width = chart.timeScale().width();
	close(series.pointById('large').x, ((50 + 50) / 200) * (width - 1), 0.5, 'x of a point in a pinned X range');
	// A narrower one hides the points outside it.
	series.applyOptions({ xRange: { min: 20, max: 60 } });
	await frames();
	if (series.pointById('small') !== null || series.pointById('middle') !== null) { throw new Error('Points outside xRange are drawn'); }
	close(series.pointById('large').x, ((50 - 20) / 40) * (width - 1), 0.5, 'x of a point in a narrow X range');
	// Open ends go back to automatic.
	series.applyOptions({ xRange: { min: null, max: null } });
	await frames();
	domain = series.xDomain();
	if (domain.min !== 10 || domain.max !== 90) { throw new Error(`xRange did not go back to automatic: ${JSON.stringify(domain)}`); }
	if (series.options().xRange.min !== null) { throw new Error('options() still reports the old xRange'); }
	fieldsKept('xRange');

	// A pinned Y range puts its ends at the scale margins (5% each by default).
	series.applyOptions({ yRange: { min: -100, max: 200 } });
	await frames();
	const height = chart.paneSize().height;
	const underlying = series.series();
	close(underlying.priceToCoordinate(200), height * 0.05, 1.5, 'y of yRange.max');
	close(underlying.priceToCoordinate(-100), height * 0.95, 1.5, 'y of yRange.min');
	// An open upper end autoscales to the data again, with room for the largest point.
	series.applyOptions({ yRange: { max: null } });
	await frames();
	close(underlying.priceToCoordinate(-100), height * 0.95, 1.5, 'y of the pinned lower end');
	const top = series.pointById('middle');
	if (top.y - top.radius < 0) { throw new Error(`The topmost point is clipped: y ${top.y}, radius ${top.radius}`); }
	if (underlying.priceToCoordinate(200) > 0) { throw new Error('The open upper end still includes the old pinned value'); }
	fieldsKept('yRange');

	// Nested objects merge: plotBorder.visible keeps the default colour.
	series.applyOptions({ plotBorder: { visible: true } });
	if (!series.options().plotBorder.visible || series.options().plotBorder.color !== '#9598A1') {
		throw new Error(`plotBorder did not merge: ${JSON.stringify(series.options().plotBorder)}`);
	}
	// Series options are passed on.
	series.applyOptions({ visible: false });
	if (underlying.options().visible !== false || series.options().visible !== false) { throw new Error('visible was not passed on'); }
	series.applyOptions({ visible: true });
	fieldsKept('series options');
}
