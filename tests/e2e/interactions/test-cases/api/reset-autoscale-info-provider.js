// Verifies that resetting `autoscaleInfoProvider` back to `undefined` via
// applyOptions restores the default autoscaling behaviour.
//
// This is intentionally an interactions test (single build) and not a graphics
// test: graphics tests assert pixel-equality between the previous (golden) build
// and the current build, so a test that exercises this behavioural fix would
// always diff between the buggy and fixed builds and could never pass.

const PROBE_PRICE = 30;

let coordinateWithDefaultAutoscale = null;
let coordinateWithCustomProvider = null;
let coordinateAfterReset = null;

function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return [];
}

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, {
		layout: {
			attributionLogo: false,
		},
	});

	const series = chart.addSeries(LightweightCharts.LineSeries);

	series.setData([
		{ time: '2020-01-01', value: 10 },
		{ time: '2020-01-02', value: 20 },
		{ time: '2020-01-03', value: 30 },
		{ time: '2020-01-04', value: 40 },
		{ time: '2020-01-05', value: 50 },
	]);
	chart.timeScale().fitContent();

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			// 1. default autoscale (no provider)
			coordinateWithDefaultAutoscale = series.priceToCoordinate(PROBE_PRICE);

			// 2. apply a custom provider that forces a much larger price range
			series.applyOptions({
				autoscaleInfoProvider: () => ({
					priceRange: { minValue: 0, maxValue: 1000 },
				}),
			});

			requestAnimationFrame(() => {
				coordinateWithCustomProvider = series.priceToCoordinate(PROBE_PRICE);

				// 3. reset the provider back to undefined
				series.applyOptions({ autoscaleInfoProvider: undefined });

				requestAnimationFrame(() => {
					coordinateAfterReset = series.priceToCoordinate(PROBE_PRICE);
					resolve();
				});
			});
		});
	});
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	if (
		coordinateWithDefaultAutoscale === null ||
		coordinateWithCustomProvider === null ||
		coordinateAfterReset === null
	) {
		throw new Error(
			`Expected price coordinates to be measurable in every step. ` +
			`default=${String(coordinateWithDefaultAutoscale)} ` +
			`provider=${String(coordinateWithCustomProvider)} ` +
			`reset=${String(coordinateAfterReset)}`
		);
	}

	// Sanity check: the custom provider must actually change the scale,
	// otherwise the test below wouldn't prove anything.
	if (Math.abs(coordinateWithCustomProvider - coordinateWithDefaultAutoscale) < 1) {
		throw new Error(
			`Expected the custom autoscaleInfoProvider to change the price scale. ` +
			`default=${coordinateWithDefaultAutoscale} provider=${coordinateWithCustomProvider}`
		);
	}

	// The actual fix: resetting the provider to undefined must restore the
	// default autoscaling, so the probe coordinate must return to its original
	// position (and must differ from the custom-provider position).
	if (Math.abs(coordinateAfterReset - coordinateWithDefaultAutoscale) > 1) {
		throw new Error(
			`Expected resetting autoscaleInfoProvider to undefined to restore default autoscaling. ` +
			`default=${coordinateWithDefaultAutoscale} afterReset=${coordinateAfterReset} ` +
			`(still matches custom provider=${coordinateWithCustomProvider})`
		);
	}

	return Promise.resolve();
}
