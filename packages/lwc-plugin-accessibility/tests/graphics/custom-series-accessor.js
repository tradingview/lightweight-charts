// A custom series is opaque to the plugin: without `valueAccessor` every point
// announces "no value" and the focus ring has nowhere to go. With the accessors
// the ring lands on the middle of the band, exactly as for a built-in series.

function generateBandData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		const middle = 50 + Math.sin(i / 8) * 15;
		res.push({ time: time.getTime() / 1000, high: middle + 6, low: middle - 6 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// A minimal band series: one filled column per bar between `low` and `high`.
function createBandSeriesView() {
	let data = null;
	const renderer = {
		draw: function (target, priceToCoordinate) {
			target.useBitmapCoordinateSpace(function (scope) {
				if (data === null || data.visibleRange === null) {
					return;
				}
				const ctx = scope.context;
				ctx.save();
				ctx.fillStyle = '#26A69A';
				const width = Math.max(1, Math.round(data.barSpacing * 0.7 * scope.horizontalPixelRatio));
				for (let i = data.visibleRange.from; i < data.visibleRange.to; ++i) {
					const bar = data.bars[i];
					const high = priceToCoordinate(bar.originalData.high);
					const low = priceToCoordinate(bar.originalData.low);
					if (high === null || low === null) {
						continue;
					}
					const x = Math.round(bar.x * scope.horizontalPixelRatio);
					ctx.fillRect(
						x - Math.round(width / 2),
						Math.round(high * scope.verticalPixelRatio),
						width,
						Math.round((low - high) * scope.verticalPixelRatio)
					);
				}
				ctx.restore();
			});
		},
	};
	return {
		priceValueBuilder: item => [item.low, item.high, (item.high + item.low) / 2],
		isWhitespace: item => item.high === undefined,
		defaultOptions: () => LightweightCharts.customSeriesDefaultOptions,
		renderer: () => renderer,
		update: function (nextData) {
			data = nextData;
		},
	};
}

function waitFrames(count) {
	let promise = Promise.resolve();
	for (let i = 0; i < count; ++i) {
		promise = promise.then(() => new Promise(resolve => requestAnimationFrame(() => resolve())));
	}
	return promise;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));

	const band = chart.addCustomSeries(createBandSeriesView(), { title: 'Band' });
	band.setData(generateBandData());
	chart.timeScale().fitContent();

	const controller = (window.a11y = LwcPlugin.addAccessibilityPlugin(chart, {
		chartTitle: 'Custom band series',
		valueAccessor: point => (point.high + point.low) / 2,
		rangeAccessor: point => ({ high: point.high, low: point.low }),
	}));

	return waitFrames(4)
		.then(() => {
			controller.focus(0);
			const layer = document.querySelector('.lw-chart-a11y-layer');
			const press = key => layer.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true }));
			press('ArrowRight');
			for (let i = 0; i < 3; ++i) {
				press('PageUp');
			}
		})
		.then(() => waitFrames(2))
		.then(() => {
			const ring = document.querySelector('.lw-chart-a11y-focus-ring');
			if (!ring || ring.style.display === 'none') {
				throw new Error('the focus ring did not follow the custom series');
			}
		});
}
