async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380 });
	const series = ['Alpha', 'Beta'].map((title, index) => chart.addSeries(LightweightCharts.LineSeries, { title }, index));
	series.forEach(item => item.setData([{ time: '2024-01-01', value: 10 }, { time: '2024-01-02', value: 20 }]));
	const frames = async () => { for (let i = 0; i < 8; i++) { await new Promise(requestAnimationFrame); } };
	const focusedPane = () => chart.panes().findIndex(pane => pane.getHTMLElement().contains(document.activeElement));
	await frames();

	// The constructor index disagrees with the pane the primitive is attached
	// to. The plugin has to follow the pane, not the index.
	const plugin = new LwcPlugin.AccessibilityPlugin({ chartTitle: 'Chart' }, 0);
	chart.panes()[1].attachPrimitive(plugin);
	await frames();

	plugin.focus();
	if (focusedPane() !== 1) { throw new Error('The layer was built on the pane named by the index, not the attached pane'); }
	const label = document.activeElement.getAttribute('aria-label');
	if (!label.includes('Pane 2 of 2') || !label.includes('Beta')) {
		throw new Error(`Pane options did not follow the attached pane: ${label}`);
	}

	// Reordering moves the pane; the layer and its options stay with it.
	chart.panes()[1].moveTo(0);
	await frames();
	plugin.focus();
	if (focusedPane() !== 0) { throw new Error('The layer did not follow its pane after moveTo'); }
	const moved = document.activeElement.getAttribute('aria-label');
	if (!moved.includes('Pane 1 of 2') || !moved.includes('Beta')) {
		throw new Error(`Pane options did not follow the reordered pane: ${moved}`);
	}
}
