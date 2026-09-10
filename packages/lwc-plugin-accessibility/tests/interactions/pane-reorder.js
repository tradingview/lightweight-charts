async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380 });
	const series = ['Alpha', 'Beta'].map((title, index) => chart.addSeries(LightweightCharts.LineSeries, { title }, index));
	series.forEach(item => item.setData([{ time: '2024-01-01', value: 10 }, { time: '2024-01-02', value: 20 }]));
	const controller = LwcPlugin.addAccessibilityPlugin(chart, { chartTitle: index => `Chart ${index}` });
	const frames = async () => { for (let i = 0; i < 8; i++) { await new Promise(requestAnimationFrame); } };
	const focusedPane = () => chart.panes().findIndex(pane => pane.getHTMLElement().contains(document.activeElement));
	await frames();
	controller.focus(1);
	chart.panes()[1].moveTo(0);
	await frames();
	if (focusedPane() !== 0) { throw new Error('Existing keyboard focus did not follow its pane'); }
	controller.refresh();
	for (const index of [0, 1]) {
		controller.focus(index);
		if (focusedPane() !== index) { throw new Error(`focus(${index}) selected the wrong pane`); }
		const layer = document.activeElement;
		if (layer.tabIndex !== 0 || layer.getAttribute('aria-hidden') === 'true') { throw new Error('Moving layers hid a keyboard target'); }
		if (!layer.getAttribute('aria-label').startsWith(`Chart ${index}.`)) { throw new Error('Pane options did not follow the new index'); }
	}
	chart.removeSeries(series[0]);
	await frames();
	controller.focus(0);
	if (focusedPane() !== 0 || controller.plugins.length !== 1) { throw new Error('Removing a moved pane detached the wrong layer'); }
}
