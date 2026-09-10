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

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.BrushableAreaSeries(), Object.assign({
		priceLineVisible: false,
	}, fadeStyle));
	series.setData(generateData(80, 0));
	// The first range starts at logical 0, i.e. flush with the left edge of the
	// data. Each segment is styled by its right-hand point, so the range covers
	// the segments ending at points 0..19.
	series.applyOptions({
		brushRanges: [
			{ range: { from: 0, to: 20 }, style: greenStyle },
			{ range: { from: 55, to: 70 }, style: orangeStyle },
		],
	});
	chart.timeScale().fitContent();
}
