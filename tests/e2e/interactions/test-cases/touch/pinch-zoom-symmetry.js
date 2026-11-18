function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return [];
}

async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { width: 900, height: 400, timeScale: { barSpacing: 6, minBarSpacing: 0.1, maxBarSpacing: 100 } });
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(Array.from({ length: 1000 }, (unused, i) => ({ time: 1700000000 + i * 900, value: i % 10 })));
	await new Promise(resolve => requestAnimationFrame(resolve));
	const canvas = container.querySelector('table tr:first-child td:nth-child(2) canvas:last-child');
	const rect = canvas.getBoundingClientRect();
	const touches = distance => [
		new Touch({ identifier: 1, target: canvas, clientX: rect.left + 450 - distance / 2, clientY: rect.top + 150 }),
		new Touch({ identifier: 2, target: canvas, clientX: rect.left + 450 + distance / 2, clientY: rect.top + 150 }),
	];
	const pinch = async (end, samples) => {
		chart.timeScale().applyOptions({ barSpacing: 6 });
		await new Promise(resolve => requestAnimationFrame(resolve));
		canvas.dispatchEvent(new TouchEvent('touchstart', { touches: touches(100), changedTouches: touches(100), bubbles: true, cancelable: true }));
		for (let i = 1; i <= samples; i++) {
			canvas.dispatchEvent(new TouchEvent('touchmove', { touches: touches(100 + (end - 100) * i / samples), bubbles: true, cancelable: true }));
		}
		canvas.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: touches(end), bubbles: true, cancelable: true }));
		return chart.timeScale().options().barSpacing;
	};
	const smaller = await pinch(20, 20);
	const larger = await pinch(500, 20);
	if (Math.abs((smaller / 6) * (larger / 6) - 1) > 1e-10) {
		throw new Error(`Reciprocal pinch distances must produce reciprocal zoom factors: ${smaller}, ${larger}`);
	}
	const singleSample = await pinch(200, 1);
	const manySamples = await pinch(200, 20);
	if (Math.abs(singleSample - manySamples) > 1e-10) {
		throw new Error(`Pinch zoom must not depend on event frequency: ${singleSample}, ${manySamples}`);
	}
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	return Promise.resolve();
}
