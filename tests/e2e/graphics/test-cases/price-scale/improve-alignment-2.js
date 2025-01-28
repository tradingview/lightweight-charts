function runTestCase(container) {
	const chartOptions = {
		height: 500,
		width: 600,
		rightPriceScale: {
			scaleMargins: {
				top: 0,
				bottom: 0,
			},
			entireTextOnly: true,
			alignLabels: true,
		},
		layout: { attributionLogo: false },
	};

	const chart = (window.chart = LightweightCharts.createChart(
		container,
		chartOptions
	));

	const levels = [
		25.44,
		17.96,
		14.14,
		4.23,
		4.08,
		3.42,
		3.09,
		2.78,
		2.24,
		2.14,
		2.05,
		1.92,
		1.69,
		1.67,
		1.47,
		1.32,
		1.11,
		0.90712,
		0.63113,
		0.40527,
	].map(price => ({ price }));

	const colorByIndex = index => {
		const r = index & 0b10000 >> 4;
		const g = index & 0b01100 >> 2;
		const b = index & 0b00011;
		return `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255 / 4)}, ${Math.floor(b * 255 / 4)})`;
	};

	for (let i = 0; i < levels.length; i++) {
		const s = chart.addLineSeries({
			color: colorByIndex(i),
		});
		s.setData([
			{ time: 10000, value: levels[i].price },
			{ time: 20000, value: levels[i].price },
		]);
		levels[i].series = s;
	}

	for (let i = 0; i < 4; i++) {
		chart.removeSeries(levels[i].series);
		delete levels[i].series;
	}

	for (let i = 3; i >= 2; i--) {
		const s = chart.addLineSeries({
			color: colorByIndex(i),
		});
		s.setData([
			{ time: 10000, value: levels[i].price },
			{ time: 20000, value: levels[i].price },
		]);
		levels[i].series = s;
	}

	chart.timeScale().fitContent();
}
