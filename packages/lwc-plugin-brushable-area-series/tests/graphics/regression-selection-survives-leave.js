// Review finding 8. Native mouseup followed by an unrelated mouseleave.
async function runTestCase(container) {
	const t = window.PluginTest;
	const chart = t.chart(t.start(container, 'A completed brush must survive mouse leave'), { handleScroll: false, handleScale: false });
	const series = chart.addCustomSeries(new LwcPlugin.BrushableAreaSeries());
	series.setData(t.data(100, i => ({ value: 50 + Math.sin(i / 8) * 10 })));
	const interaction = new LwcPlugin.BrushableAreaInteraction();
	series.attachPrimitive(interaction);
	chart.timeScale().fitContent();
	await t.frames();
	let selected;
	window.initialInteractionsToPerform = () => [{ action: 'horizontalDrag', target: 'container' }];
	window.afterInitialInteractions = () => {
		selected = JSON.stringify(interaction.range());
		t.check('Mouse drag creates a selection', interaction.range() !== null, interaction.range() !== null, true);
	};
	window.finalInteractionsToPerform = () => [{ action: 'moveMouseXY', target: 'container', options: { x: 599, y: 599 } }];
	window.afterFinalInteractions = () => {
		t.check('Leaving the chart preserves the selection',
			interaction.range() !== null && JSON.stringify(interaction.range()) === selected,
			interaction.range() === null ? 'cleared' : 'preserved', 'preserved');
	};
}
