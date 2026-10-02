async function beforeInteractions(container) {
	const dates = ['2024-01-01', { year: 2024, month: 1, day: 1 }];
	for (const pointTime of dates) {
		for (const markerTime of dates) {
			const chart = LightweightCharts.createChart(container, { height: 380 });
			const series = chart.addSeries(LightweightCharts.LineSeries);
			series.setData([{ time: pointTime, value: 10 }]);
			const markers = LightweightCharts.createSeriesMarkers(series, [{ time: markerTime, text: 'Dividend', position: 'aboveBar', shape: 'circle', color: 'red' }]);
			const calls = [];
			const controller = LwcPlugin.addAccessibilityPlugin(chart, { markers: () => markers.markers(), onAnnounce: message => calls.push(message) });
			chart.timeScale().fitContent();
			await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
			controller.focus();
			document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
			if (!calls.some(message => message.includes('Dividend'))) { throw new Error('Equivalent marker time was not announced'); }
			controller.detach();
			chart.remove();
		}
	}
}
