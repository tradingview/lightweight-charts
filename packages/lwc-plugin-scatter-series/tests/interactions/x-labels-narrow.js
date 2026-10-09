// The X labels at the narrowest width of the design, measured as the chart
// draws them: every axis that a nice step can label twice shows two labels or
// more, evenly spaced, never overlapping — the ends pushed inside included —
// and the labels follow the width when the chart is resized.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});

	// Record what the time axis draws.
	const drawn = [];
	const fillText = CanvasRenderingContext2D.prototype.fillText;
	CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...rest) {
		drawn.push({ canvas: this.canvas, text, x, width: this.measureText(text).width, align: this.textAlign });
		return fillText.call(this, text, x, y, ...rest);
	};
	const thousands = x => `${(x / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} K`;
	const cases = [
		{ name: '-0.4…0.8', points: [{ x: -0.33, y: 1 }, { x: 0.71, y: 2 }] },
		{ name: 'PnL in K', points: [{ x: -830000, y: 1 }, { x: 1210000, y: 2 }], options: { xFormatter: thousands } },
		{ name: '0…1e6', points: [{ x: 0, y: 1 }, { x: 1e6, y: 2 }] },
		{ name: '0–90', points: [{ x: 0.4, y: 1 }, { x: 87.5, y: 2 }] },
		{ name: '0–30Y', points: [{ x: 1, y: 1 }], options: { xRange: { min: 0, max: 30 }, xFormatter: x => `${x}Y` } },
		{ name: '96–104', points: [{ x: 97, y: 1 }], options: { xRange: { min: 96, max: 104 } } },
		{ name: '0–0.05', points: [{ x: 0.001, y: 1 }, { x: 0.049, y: 2 }] },
		{ name: '-1500–1500', points: [{ x: -1450, y: 1 }, { x: 1480, y: 2 }] },
	];
	const labelsOf = (chart, stage) => {
		const canvases = Array.from(chart.chartElement().querySelectorAll('tr:last-child canvas'));
		const width = chart.timeScale().width();
		const seen = new Set();
		const labels = drawn
			.filter(item => canvases.indexOf(item.canvas) !== -1)
			// The axis may be painted more than once in a frame.
			.filter(item => {
				const key = `${item.text}@${item.x}`;
				const fresh = !seen.has(key);
				seen.add(key);
				return fresh;
			})
			// The time axis draws its labels centred, in CSS pixels.
			.map(item => ({ text: item.text, left: item.x - item.width / 2, right: item.x + item.width / 2, centre: item.x }))
			.sort((a, b) => a.centre - b.centre);
		for (let i = 1; i < labels.length; i++) {
			if (labels[i].left < labels[i - 1].right + 2) {
				throw new Error(`${stage}: "${labels[i - 1].text}" and "${labels[i].text}" overlap: ${JSON.stringify(labels)}`);
			}
		}
		if (labels.length > 0 && (labels[0].left < -0.5 || labels[labels.length - 1].right > width + 0.5)) {
			throw new Error(`${stage}: a label leaves the axis: ${JSON.stringify(labels)}`);
		}
		const steps = labels.slice(1).map((label, i) => label.centre - labels[i].centre);
		if (steps.some(step => Math.abs(step - steps[0]) > 1.5)) {
			// The labels pushed inside at the ends move; compare the inner ones.
			const inner = steps.slice(1, -1);
			if (inner.some(step => Math.abs(step - inner[0]) > 1.5)) {
				throw new Error(`${stage}: unevenly spaced labels: ${labels.map(label => label.text).join(' ')}`);
			}
		}
		return labels.map(label => label.text);
	};

	const host = document.createElement('div');
	host.style.cssText = 'position: absolute; left: 0; top: 0; height: 320px; width: 300px;';
	document.body.appendChild(host);
	const results = [];
	for (const testCase of cases) {
		host.style.width = '300px';
		const chart = LwcPlugin.createScatterChart(host, { autoSize: true, layout: { attributionLogo: false } });
		const series = LwcPlugin.createScatterSeries(chart, testCase.options || {});
		series.setData(testCase.points);
		await frames(4);
		drawn.length = 0;
		chart.applyOptions({});
		await frames(2);
		const narrow = labelsOf(chart, `${testCase.name} at 300 px`);
		if (narrow.length < 2) { throw new Error(`${testCase.name} at 300 px shows ${narrow.length} label(s): ${narrow.join(' ')}`); }
		// Wider: at least as many labels. Narrower again: as before.
		host.style.width = '900px';
		await frames(5);
		drawn.length = 0;
		chart.applyOptions({});
		await frames(2);
		const wide = labelsOf(chart, `${testCase.name} at 900 px`);
		if (wide.length < narrow.length) { throw new Error(`${testCase.name}: fewer labels when wider: ${narrow.join(' ')} -> ${wide.join(' ')}`); }
		host.style.width = '300px';
		await frames(5);
		drawn.length = 0;
		chart.applyOptions({});
		await frames(2);
		const back = labelsOf(chart, `${testCase.name} back at 300 px`);
		if (back.join(' ') !== narrow.join(' ')) { throw new Error(`${testCase.name}: the labels did not come back: ${narrow.join(' ')} -> ${back.join(' ')}`); }
		results.push(`${testCase.name}: ${narrow.join(' ')} | ${wide.join(' ')}`);
		chart.remove();
	}
	CanvasRenderingContext2D.prototype.fillText = fillText;
	host.remove();
	window.xLabelResults = results;
}
