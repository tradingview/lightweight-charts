function runTestCase(container) {
	const formatter = new Intl.DateTimeFormat('ja-JP', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC',
	});
	const Behavior = LightweightCharts.defaultHorzScaleBehavior();
	class UniformWeights extends Behavior {
		fillWeightsForPoints(points, startIndex) {
			for (let i = startIndex; i < points.length; i++) {
				points[i].timeWeight = 1;
			}
		}
	}
	const chart = LightweightCharts.createChartEx(container, new UniformWeights(), {
		width: 360,
		height: 300,
		timeScale: {
			fixLeftEdge: true,
			fixRightEdge: true,
			tickMarkMaxCharacterLength: 12,
			tickMarkFormatter: time => formatter.format(new Date(time * 1000)),
		},
	});
	chart.addSeries(LightweightCharts.LineSeries).setData(Array.from({ length: 150 }, (_, i) => ({
		time: 1539907200 + i * 86400,
		value: 100 + Math.sin(i),
	})));
	chart.timeScale().fitContent();
}

window.ignoreMouseMove = true;
