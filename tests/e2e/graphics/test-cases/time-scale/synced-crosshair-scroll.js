async function runTestCase(container) {
	const charts = [];
	const series = [];
	for (let i = 0; i < 2; i++) {
		const element = document.createElement('div');
		container.appendChild(element);
		const chart = LightweightCharts.createChart(element, {
			width: 600,
			height: 250,
			crosshair: { mode: 0 },
			rightPriceScale: { minimumWidth: 70 },
		});
		const line = chart.addSeries(LightweightCharts.LineSeries);
		line.setData(Array.from({ length: 200 }, (_, index) => ({
			time: 1600000000 + index * 86400,
			value: 100 + Math.sin(index),
		})));
		charts.push(chart);
		series.push(line);
	}
	for (let i = 0; i < 2; i++) {
		charts[i].timeScale().subscribeVisibleLogicalRangeChange(range => {
			charts[1 - i].timeScale().setVisibleLogicalRange(range);
		});
		charts[i].subscribeCrosshairMove(event => {
			const point = event.seriesData.get(series[i]);
			if (point) {
				charts[1 - i].setCrosshairPosition(point.value, point.time, series[1 - i]);
			}
		});
	}
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const canvas = container.querySelector('canvas[style*="z-index: 2"]');
	const bounds = canvas.getBoundingClientRect();
	canvas.dispatchEvent(new MouseEvent('mouseenter', {
		bubbles: true,
		sourceCapabilities: new window.InputDeviceCapabilities({ firesTouchEvents: false }),
		clientX: bounds.left + 250,
		clientY: bounds.top + 100,
	}));
	canvas.dispatchEvent(new MouseEvent('mousemove', {
		bubbles: true,
		sourceCapabilities: new window.InputDeviceCapabilities({ firesTouchEvents: false }),
		clientX: bounds.left + 250,
		clientY: bounds.top + 100,
	}));
	charts[0].timeScale().scrollToPosition(-10, false);
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

window.ignoreMouseMove = true;
