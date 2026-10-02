// A host mutation has committed before data listeners run, even when they throw.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);
	const point = (time, value = time) => ({ time, value });
	for (const operation of ['setData', 'update', 'pop']) {
		const series = LwcPlugin.createPrettyHistogramSeries(chart);
		series.setData([point(1), point(2)]);
		const fail = () => { throw new Error('application callback'); };
		series.subscribeDataChanged(fail);
		try {
			if (operation === 'setData') { series.setData([point(3)]); }
			else if (operation === 'update') { series.update(point(3)); }
			else { series.pop(1); }
			throw new Error('Expected application callback to throw');
		} catch (error) {
			if (error.message !== 'application callback') { throw error; }
		}
		series.unsubscribeDataChanged(fail);
		const committed = series.data().map(({ time, value }) => ({ time, value }));
		series.applyOptions({ base: 100 });
		const actual = series.data().map(({ time, value }) => ({ time, value }));
		if (JSON.stringify(actual) !== JSON.stringify(committed)) {
			throw new Error(`${operation}: option change overwrote committed data`);
		}
		chart.removeSeries(series);
	}
	const series = LwcPlugin.createPrettyHistogramSeries(chart);
	series.setData([point(1), point(2)]);
	const replace = () => {
		series.unsubscribeDataChanged(replace);
		series.update(point(2, 200));
		series.applyOptions({ base: 100 });
	};
	series.subscribeDataChanged(replace);
	series.pop(1);
	if (series.data().length !== 2 || series.data()[1].value !== 200) {
		throw new Error('Option change discarded a replacement written during pop');
	}
}
