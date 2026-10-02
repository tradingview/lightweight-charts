async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380, crosshair: { mode: LightweightCharts.CrosshairMode.Normal } });
	const series = LwcPlugin.createStackedAreaSeries(chart, { gapHandling: 'break' });
	const time = index => 1704067200 + index * 86400;
	series.setData(Array.from({ length: 9 }, (_, i) => i >= 3 && i <= 5 ? { time: time(i) } : { time: time(i), values: [10, 5] }));
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const events = [];
	chart.subscribeCrosshairMove(event => events.push({ hovered: event.hoveredSeries === series, id: event.hoveredObjectId }));
	const canvas = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas');
	const box = canvas.getBoundingClientRect();
	const host = container.getBoundingClientRect();
	const move = (index, offset = 0) => ({ action: 'moveMouseXY', target: 'container', options: {
		x: box.left - host.left + chart.timeScale().timeToCoordinate(time(index)) + offset,
		y: box.top - host.top + series.priceToCoordinate(5),
	} });
	window.initialInteractionsToPerform = () => [move(1), move(4)];
	window.afterInitialInteractions = async () => {
		if (!events.some(event => event.hovered && event.id === '0')) { throw new Error('Painted band was not hit'); }
		if (events[events.length - 1]?.hovered) { throw new Error('Whitespace gap was hit'); }
		series.applyOptions({ gapHandling: 'bridge' });
		await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	};
	window.finalInteractionsToPerform = () => [move(4, 1)];
	window.afterFinalInteractions = () => {
		if (!events[events.length - 1]?.hovered) { throw new Error('Bridged band was not hit'); }
	};
}
