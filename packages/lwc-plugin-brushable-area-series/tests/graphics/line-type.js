function generateData(count, startIndex) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	time.setUTCDate(time.getUTCDate() + startIndex);
	for (let i = 0; i < count; ++i) {
		const j = i + startIndex;
		res.push({
			time: time.getTime() / 1000,
			value: 60 + Math.sin(j / 9) * 20 + Math.cos(j / 4) * 6,
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

const fadeStyle = {
	lineColor: 'rgba(40, 98, 255, 0.2)',
	topColor: 'rgba(40, 98, 255, 0.05)',
	bottomColor: 'rgba(40, 98, 255, 0)',
	lineWidth: 2,
};

const greenStyle = {
	lineColor: 'rgb(4, 153, 129)',
	topColor: 'rgba(4, 153, 129, 0.4)',
	bottomColor: 'rgba(4, 153, 129, 0)',
	lineWidth: 4,
};

const orangeStyle = {
	lineColor: 'rgb(245, 124, 0)',
	topColor: 'rgba(245, 124, 0, 0.4)',
	bottomColor: 'rgba(245, 124, 0, 0)',
	lineWidth: 4,
};

// `lineType` shapes both the line and the fill: stepped on top, curved below.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const data = generateData(40, 0);

	const stepped = chart.addCustomSeries(new LwcPlugin.BrushableAreaSeries(), Object.assign({
		priceLineVisible: false,
		lineType: LightweightCharts.LineType.WithSteps,
	}, greenStyle));
	stepped.setData(data);

	const curved = chart.addCustomSeries(new LwcPlugin.BrushableAreaSeries(), Object.assign({
		priceLineVisible: false,
		lineType: LightweightCharts.LineType.Curved,
	}, orangeStyle));
	curved.setData(data.map(point => ({ time: point.time, value: point.value - 40 })));

	chart.timeScale().fitContent();
}
