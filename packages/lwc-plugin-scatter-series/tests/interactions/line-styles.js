// The connecting line of a group is drawn in its lineStyle with the dash
// pattern of the chart's own lines: dotted, sparse dotted and dashed lines
// keep their gaps — no cap closes them — in the share the pattern gives
// (half the length off for Dotted, Dashed and LargeDashed, four fifths for
// SparseDotted); a solid line has none.
async function beforeInteractions(container) {
	const frames = (count = 2) => new Promise(resolve => {
		const step = left => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
		step(count);
	});
	const chart = LwcPlugin.createScatterChart(container, {
		width: 400,
		height: 300,
		layout: { attributionLogo: false },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
	});
	const { LineStyle } = LightweightCharts;
	const styles = [
		['Solid', LineStyle.Solid, 0],
		['Dotted', LineStyle.Dotted, 0.5],
		['Dashed', LineStyle.Dashed, 0.5],
		['LargeDashed', LineStyle.LargeDashed, 0.5],
		['SparseDotted', LineStyle.SparseDotted, 0.8],
	];
	for (const [name, lineStyle, gaps] of styles) {
		const series = LwcPlugin.createScatterSeries(chart, {
			yRange: { min: 0, max: 2 },
			groups: [{ id: 'tail', lineVisible: true, lineWidth: 2, lineStyle, lineColor: '#000000', opacity: 0 }],
		});
		series.setData([{ x: 0, y: 1, group: 'tail' }, { x: 100, y: 1, group: 'tail' }]);
		await frames(3);
		const canvas = container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas');
		const ratio = canvas.width / canvas.clientWidth;
		const y = series.series().priceToCoordinate(1);
		// 120 CSS pixels of the line, away from its ends, along its centre row
		// (the line is centred on y, which may fall between two rows).
		const row = canvas.getContext('2d').getImageData(Math.round(100 * ratio), Math.floor(y * ratio), Math.round(120 * ratio), 1).data;
		let light = 0;
		for (let i = 0; i < row.length; i += 4) {
			if (row[i] > 127) {
				light++;
			}
		}
		const share = light / (row.length / 4);
		if (Math.abs(share - gaps) > 0.12) {
			throw new Error(`A ${name} line should leave ${gaps * 100}% of its length off, it leaves ${(share * 100).toFixed(0)}%`);
		}
		series.remove();
	}
}
