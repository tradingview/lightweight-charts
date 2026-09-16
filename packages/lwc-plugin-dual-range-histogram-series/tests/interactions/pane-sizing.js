async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 500 });
	chart.addSeries(LightweightCharts.LineSeries).setData([{ time: 1, value: 10 }]);
	const series = LwcPlugin.createDualRangeHistogramSeries(chart, { maxHeight: 40 }, 1);
	series.setData([{ time: 1, values: [10, -10] }]);
	chart.panes()[0].setHeight(350);
	chart.panes()[1].setHeight(120);
	const stop = LwcPlugin.keepPixelSeriesInView(chart, series);
	const assertMargins = async () => {
		const deadline = performance.now() + 3000;
		while (performance.now() < deadline) {
			await new Promise(resolve => requestAnimationFrame(resolve));
			const expected = Math.min(0.3, 20 / chart.paneSize(series.getPane().paneIndex()).height);
			const margins = series.priceScale().options().scaleMargins;
			if (Math.abs(margins.top - expected) < 0.00001 && Math.abs(margins.bottom - expected) < 0.00001) { return; }
		}
		throw new Error('Pixel-height margins did not follow the series pane');
	};
	await assertMargins();
	chart.panes()[1].setHeight(220);
	await assertMargins();
	series.moveToPane(0);
	await assertMargins();
	stop();
	stop();
	series.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } });
	series.applyOptions({ maxHeight: 90 });
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	if (series.priceScale().options().scaleMargins.top !== 0.1) { throw new Error('Stopped sizing helper still writes margins'); }
	const stopRemoved = LwcPlugin.keepPixelSeriesInView(chart, series);
	series.applyOptions({ maxHeight: 120 });
	chart.removeSeries(series);
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	stopRemoved();

}
