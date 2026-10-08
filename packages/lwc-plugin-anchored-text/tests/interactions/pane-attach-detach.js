// A pane primitive follows its pane: it paints in the pane it is attached to,
// survives that pane being removed, and can be attached to another pane.

// Counts the dark pixels inside a CSS-pixel box of the pane, on every canvas
// of the pane (the layer a primitive is drawn on depends on its zOrder).
function darkPixels(pane, box) {
	let count = 0;
	for (const canvas of pane.getHTMLElement().querySelectorAll("td[style*=\"relative\"] canvas")) {
		const ratio = canvas.width / canvas.getBoundingClientRect().width;
		const x = Math.floor(box.x * ratio);
		const y = Math.floor(box.y * ratio);
		const w = Math.ceil(box.width * ratio);
		const h = Math.ceil(box.height * ratio);
		const data = canvas.getContext("2d").getImageData(x, y, w, h).data;
		for (let i = 0; i < data.length; i += 4) {
			if (data[i + 3] > 0 && Math.max(data[i], data[i + 1], data[i + 2]) < 128) {
				count++;
			}
		}
	}
	return count;
}

// The default anchor is top-left with 20px / 10px margins and a 14px font.
const textBox = { x: 20, y: 8, width: 120, height: 24 };

async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, {
		height: 380,
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
	});
	const data = Array.from({ length: 50 }, (_unused, i) => ({ time: 1704067200 + i * 86400, value: 30 + Math.sin(i / 5) * 10 }));
	const series = chart.addSeries(LightweightCharts.LineSeries, { color: '#F0F0F0' });
	series.setData(data);
	const secondSeries = chart.addSeries(LightweightCharts.LineSeries, { color: '#F0F0F0' }, 1);
	secondSeries.setData(data);
	chart.timeScale().fitContent();
	const frames = async () => { for (let i = 0; i < 4; i++) { await new Promise(requestAnimationFrame); } };

	const text = new LwcPlugin.AnchoredTextPane({ text: 'Pane label', color: '#000000' });

	chart.panes()[1].attachPrimitive(text);
	await frames();
	if (darkPixels(chart.panes()[1], textBox) === 0) {
		throw new Error('The text was not painted in the pane it was attached to');
	}
	if (darkPixels(chart.panes()[0], textBox) !== 0) {
		throw new Error('The text leaked into another pane');
	}

	// Removing the last series removes the pane, and the library detaches
	// the primitive with it.
	chart.removeSeries(secondSeries);
	await frames();
	if (chart.panes().length !== 1) {
		throw new Error('The empty pane was not removed');
	}

	chart.panes()[0].attachPrimitive(text);
	await frames();
	if (darkPixels(chart.panes()[0], textBox) === 0) {
		throw new Error('The text was not painted after being attached to another pane');
	}
	if (text.options().text !== 'Pane label') {
		throw new Error('The options were lost across panes');
	}

	// A redraw requested after the move must reach the new pane, not the
	// removed one.
	text.setText('');
	await frames();
	if (darkPixels(chart.panes()[0], textBox) !== 0) {
		throw new Error('setText did not redraw the new pane');
	}
	text.setText('Pane label');
	await frames();
	if (darkPixels(chart.panes()[0], textBox) === 0) {
		throw new Error('setText did not paint the text back in the new pane');
	}
}
