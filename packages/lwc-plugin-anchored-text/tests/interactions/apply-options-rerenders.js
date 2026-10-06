// applyOptions asks the chart to redraw by itself: clearing the text removes
// it from the canvas, and setting it again paints it back.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, {
		height: 380,
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
	});
	const series = chart.addSeries(LightweightCharts.LineSeries, { color: '#F0F0F0' });
	series.setData(Array.from({ length: 50 }, (_unused, i) => ({ time: 1704067200 + i * 86400, value: 30 + Math.sin(i / 5) * 10 })));
	chart.timeScale().fitContent();
	const frames = async () => { for (let i = 0; i < 4; i++) { await new Promise(requestAnimationFrame); } };

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

	const text = new LwcPlugin.AnchoredText({ text: 'Anchored text', color: '#000000' });
	series.attachPrimitive(text);
	await frames();
	const pane = chart.panes()[0];
	if (darkPixels(pane, textBox) === 0) {
		throw new Error('The text was not painted after attach');
	}

	text.applyOptions({ text: '' });
	await frames();
	if (darkPixels(pane, textBox) !== 0) {
		throw new Error('Clearing the text through applyOptions did not redraw the pane');
	}

	text.setText('Anchored text');
	await frames();
	if (darkPixels(pane, textBox) === 0) {
		throw new Error('setText did not redraw the pane');
	}
}
