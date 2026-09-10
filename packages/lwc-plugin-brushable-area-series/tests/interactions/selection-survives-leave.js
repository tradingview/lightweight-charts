// Native mouseup followed by an unrelated mouseleave.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380, handleScroll: false, handleScale: false });
	const series = chart.addCustomSeries(new LwcPlugin.BrushableAreaSeries());
	series.setData(Array.from({ length: 100 }, (_, i) => ({ time: 1704067200 + i * 86400, value: 50 + Math.sin(i / 8) * 10 })));
	const interaction = new LwcPlugin.BrushableAreaInteraction();
	series.attachPrimitive(interaction);
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	let selected;
	window.initialInteractionsToPerform = () => [{ action: 'horizontalDrag', target: 'container' }];
	window.afterInitialInteractions = () => {
		selected = JSON.stringify(interaction.range());
		if (interaction.range() === null) { throw new Error('The drag did not create a selection'); }
	};
	window.finalInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'container', options: { x: 599, y: 599 } }];
	window.afterFinalInteractions = () => {
		if (interaction.range() === null || JSON.stringify(interaction.range()) !== selected) {
			throw new Error('Leaving the chart cleared or changed the completed selection');
		}
	};
}
