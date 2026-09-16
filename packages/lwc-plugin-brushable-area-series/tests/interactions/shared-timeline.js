// Extra timestamps must not erase the area, while actual whitespace must survive updates.
async function beforeInteractions(container) {
	const time = index => 1704067200 + index * 86400;
	for (const factory of [false, true]) {
		const chart = LightweightCharts.createChart(container, {
			height: 380, grid: { vertLines: { visible: false }, horzLines: { visible: false } },
		});
		const options = { priceLineVisible: false, lastValueVisible: false };
		const series = factory ? LwcPlugin.createBrushableAreaSeries(chart, options) : chart.addCustomSeries(new LwcPlugin.BrushableAreaSeries(), options);
		const data = [0, 2, 4, 6, 8].map(index => ({ time: time(index), value: 15 }));
		series.setData(data);
		const reference = chart.addSeries(LightweightCharts.LineSeries, { visible: false });
		reference.setData([1, 3, 5, 7].map(index => ({ time: time(index), value: 1 })));
		chart.timeScale().fitContent();
		const frames = async () => { for (let i = 0; i < 4; i++) { await new Promise(requestAnimationFrame); } };
		const painted = () => {
			const canvas = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas');
			const ratio = canvas.width / canvas.getBoundingClientRect().width;
			const x = chart.timeScale().timeToCoordinate(time(4));
			const y = series.priceToCoordinate(14.99);
			const pixel = canvas.getContext('2d').getImageData(Math.floor(x * ratio), Math.floor(y * ratio), 1, 1).data;
			return Math.max(...pixel.slice(0, 3)) - Math.min(...pixel.slice(0, 3)) > 20;
		};
		await frames();
		if (!painted()) { throw new Error('Interleaved timestamps erased the area'); }
		if (factory) {
			series.setData(data.map((point, index) => index === 2 ? { time: point.time } : point));
			await frames();
			if (painted()) { throw new Error('Explicit whitespace was bridged'); }
			series.update({ time: time(4), value: 15 }, true);
			await frames();
			if (!painted()) { throw new Error('Filling historical whitespace did not reconnect the area'); }
			series.update({ time: time(4) }, true);
			await frames();
			if (painted()) { throw new Error('Historical whitespace did not break the area'); }
			series.setData(data);
			await frames();
			if (!painted()) { throw new Error('Replacing data retained an old whitespace gap'); }
		}
		chart.remove();
	}
}
