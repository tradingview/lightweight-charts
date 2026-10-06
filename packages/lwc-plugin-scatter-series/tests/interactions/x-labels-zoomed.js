// Zoomed in by the user (the host switches zooming on), the X labels are
// chosen again for the part of the axis in view. At the narrowest width of the
// design, with long labels, two labels or more stay in view at every zoom —
// with the labels of the fit, a zoomed axis could fall to a single one —
// never overlapping, and evenly spaced; back to the whole domain, the labels
// of the fit return. Measured as the chart draws them.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const drawn = [];
	const fillText = CanvasRenderingContext2D.prototype.fillText;
	CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...rest) {
		drawn.push({ canvas: this.canvas, text, x, width: this.measureText(text).width });
		return fillText.call(this, text, x, y, ...rest);
	};
	const thousands = x => `${(x / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} K`;

	container.style.width = '300px';
	container.style.height = '320px';
	const chart = LwcPlugin.createScatterChart(container, {
		autoSize: true,
		handleScroll: true,
		handleScale: true,
		layout: { attributionLogo: false },
	});
	const timeScale = chart.timeScale();
	const series = LwcPlugin.createScatterSeries(chart, { xFormatter: thousands });
	series.setData([{ x: -830000, y: 1 }, { x: 1210000, y: 2 }]);
	await frames(4);

	/** The labels drawn in view, checked: no overlap, evenly spaced, two or more. */
	const labelsInView = async stage => {
		drawn.length = 0;
		chart.applyOptions({});
		await frames(2);
		const canvases = Array.from(chart.chartElement().querySelectorAll('tr:last-child canvas'));
		const width = timeScale.width();
		const seen = new Set();
		const labels = drawn
			.filter(item => canvases.indexOf(item.canvas) !== -1)
			.filter(item => {
				const key = `${item.text}@${item.x}`;
				const fresh = !seen.has(key);
				seen.add(key);
				return fresh;
			})
			.map(item => ({ text: item.text, left: item.x - item.width / 2, right: item.x + item.width / 2, centre: item.x }))
			.filter(label => label.centre >= 0 && label.centre <= width)
			.sort((a, b) => a.centre - b.centre);
		for (let i = 1; i < labels.length; i++) {
			if (labels[i].left < labels[i - 1].right + 2) {
				throw new Error(`${stage}: "${labels[i - 1].text}" and "${labels[i].text}" overlap`);
			}
		}
		// Evenly spaced: every step a multiple of the label step — compare values.
		const values = labels.map(label => Number(label.text.replace(/[^0-9.-]/g, '')));
		const steps = values.slice(1).map((value, i) => value - values[i]);
		if (steps.some(step => Math.abs(step - steps[0]) > 1e-6)) { throw new Error(`${stage}: unevenly spaced labels: ${labels.map(l => l.text).join(' ')}`); }
		if (labels.length < 2) { throw new Error(`${stage}: ${labels.length} label(s) in view: ${labels.map(l => l.text).join(' ')}`); }
		return labels.map(label => label.text).join(' ');
	};

	const fitted = await labelsInView('fitted');
	window.initialInteractionsToPerform = () => [
		{ action: 'moveMouseCenter', target: 'pane' },
		...Array.from({ length: 30 }, () => ({ action: 'scrollUp' })),
	];
	window.afterInitialInteractions = async () => {
		try {
			await frames(3);
			if (timeScale.options().barSpacing < 1.2 * (timeScale.width() - 1) / 50) { throw new Error('The wheel did not zoom in'); }
			await labelsInView('zoomed in with the wheel');

			// Further zoom levels, around the middle and both sides of the axis.
			const first = timeScale.timeToIndex(series.xDomain().min, false);
			const last = timeScale.timeToIndex(series.xDomain().max, false);
			for (const spacing of [6.5, 8.08, 8.89, 9.78, 12, 16, 24]) {
				for (const at of [0.3, 0.5, 0.7]) {
					const middle = first + at * (last - first);
					const length = timeScale.width() / spacing - 1;
					timeScale.setVisibleLogicalRange({ from: middle - length / 2, to: middle + length / 2 });
					await frames(3);
					await labelsInView(`at a spacing of ${spacing} around ${at}`);
				}
			}

			series.fitXDomain();
			await frames(3);
			const back = await labelsInView('fitted again');
			if (back !== fitted) { throw new Error(`The labels of the fit did not return: ${fitted} -> ${back}`); }
		} finally {
			CanvasRenderingContext2D.prototype.fillText = fillText;
		}
	};
}
