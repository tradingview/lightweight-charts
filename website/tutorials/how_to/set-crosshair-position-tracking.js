// remove-start
// Lightweight Charts™ Example: Crosshair syncing
// https://tradingview.github.io/lightweight-charts/tutorials/how_to/set-crosshair-position
// remove-end

// hide-start
function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

const chart = createChart(
	document.getElementById('container'),
	{
		handleScale: false,
		handleScroll: false,
	}
);

const mainSeries = chart.addLineSeries({
	priceFormat: {
		minMove: 1,
		precision: 0,
	},
});

mainSeries.setData(generateData());

chart.timeScale().fitContent();
// hide-end

document.getElementById('container').addEventListener('touchmove', e => {
	const bcr = document.getElementById('container').getBoundingClientRect();
	const x = bcr.left + e.touches[0].clientX;
	const y = bcr.top + e.touches[0].clientY;

	const price = mainSeries.coordinateToPrice(y);
	const time = chart.timeScale().coordinateToTime(x);

	if (!Number.isFinite(price) || !Number.isFinite(time)) {
		return;
	}

	chart.setCrosshairPosition(price, time, mainSeries);
});

document.getElementById('container').addEventListener('touchend', () => {
	chart.clearCrosshairPosition();
});
