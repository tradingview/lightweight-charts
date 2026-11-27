function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return [];
}

function afterFinalInteractions() {
	return Promise.resolve();
}

function nextFrame() {
	return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function timeAxisLabel(coordinate, text, backColor) {
	return {
		coordinate: () => coordinate,
		text: () => text,
		textColor: () => '#FFFFFF',
		backColor: () => backColor,
	};
}

function checkLabels(chart, firstVisible, secondVisible) {
	const screenshot = chart.takeScreenshot(true);
	const axisHeight = chart.timeScale().height();
	const context = screenshot.getContext('2d');
	const { data } = context.getImageData(0, screenshot.height - axisHeight, screenshot.width, axisHeight);
	const colors = new Set();
	for (let i = 0; i < data.length; i += 4) {
		colors.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
	}

	if (colors.has(0xBB3355) !== firstVisible || colors.has(0x3344BB) !== secondVisible || !colors.has(0x338855)) {
		throw new Error(`Expected time-axis labels: First=${firstVisible}, Second=${secondVisible}, Separate=true`);
	}
}

async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });
	const first = chart.addSeries(LightweightCharts.LineSeries);
	const second = chart.addSeries(LightweightCharts.LineSeries);
	first.setData([{ time: '2025-01-01', value: 10 }]);

	const left = timeAxisLabel(0, 'First', '#BB3355');
	const middle = timeAxisLabel(40, 'Second', '#3344BB');
	const right = timeAxisLabel(180, 'Separate', '#338855');
	const overlappingPrimitive = { timeAxisViews: () => [middle] };
	first.attachPrimitive({ timeAxisViews: () => [left, right] });
	second.attachPrimitive(overlappingPrimitive);
	await nextFrame();

	checkLabels(chart, false, true);

	second.detachPrimitive(overlappingPrimitive);
	await nextFrame();

	checkLabels(chart, true, false);
}
