// remove-start
// Lightweight Charts Example: Tracking Tooltip
// https://tradingview.github.io/lightweight-charts/tutorials/how_to/tooltips

// remove-end
const chartOptions = {
	layout: {
		textColor: CHART_TEXT_COLOR,
		background: { type: 'solid', color: CHART_BACKGROUND_COLOR },
	},
};
// remove-line
/** @type {import('lightweight-charts').IChartApi} */
const chart = createChart(document.getElementById('container'), chartOptions);

chart.applyOptions({
	rightPriceScale: {
		scaleMargins: {
			top: 0.3, // leave some space for the legend
			bottom: 0.25,
		},
	},
	crosshair: {
		// hide the horizontal crosshair line
		horzLine: {
			visible: false,
			labelVisible: false,
		},
		// hide the vertical crosshair label
		vertLine: {
			labelVisible: false,
		},
	},
	// hide the grid lines
	grid: {
		vertLines: {
			visible: false,
		},
		horzLines: {
			visible: false,
		},
	},
});

const series = chart.addAreaSeries({
	topColor: BASELINE_TOP_FILL_COLOR1,
	bottomColor: BASELINE_TOP_FILL_COLOR2,
	lineColor: BASELINE_TOP_LINE_COLOR,
	lineWidth: 2,
	crossHairMarkerVisible: false,
});

series.setData([
	{ time: '2016-07-18', value: 98.66 },
	// hide-start
	{ time: '2016-07-25', value: 104.21 },
	{ time: '2016-08-01', value: 107.48 },
	{ time: '2016-08-08', value: 108.18 },
	{ time: '2016-08-15', value: 109.36 },
	{ time: '2016-08-22', value: 106.94 },
	{ time: '2016-08-29', value: 107.73 },
	{ time: '2016-09-05', value: 103.13 },
	{ time: '2016-09-12', value: 114.92 },
	{ time: '2016-09-19', value: 112.71 },
	{ time: '2016-09-26', value: 113.05 },
	{ time: '2016-10-03', value: 114.06 },
	{ time: '2016-10-10', value: 117.63 },
	{ time: '2016-10-17', value: 116.6 },
	{ time: '2016-10-24', value: 113.72 },
	{ time: '2016-10-31', value: 108.84 },
	{ time: '2016-11-07', value: 108.43 },
	{ time: '2016-11-14', value: 110.06 },
	{ time: '2016-11-21', value: 111.79 },
	{ time: '2016-11-28', value: 109.9 },
	{ time: '2016-12-05', value: 113.95 },
	{ time: '2016-12-12', value: 115.97 },
	{ time: '2016-12-19', value: 116.52 },
	{ time: '2016-12-26', value: 115.82 },
	{ time: '2017-01-02', value: 117.91 },
	{ time: '2017-01-09', value: 119.04 },
	{ time: '2017-01-16', value: 120.0 },
	{ time: '2017-01-23', value: 121.95 },
	{ time: '2017-01-30', value: 129.08 },
	{ time: '2017-02-06', value: 132.12 },
	{ time: '2017-02-13', value: 135.72 },
	{ time: '2017-02-20', value: 136.66 },
	{ time: '2017-02-27', value: 139.78 },
	{ time: '2017-03-06', value: 139.14 },
	{ time: '2017-03-13', value: 139.99 },
	{ time: '2017-03-20', value: 140.64 },
	{ time: '2017-03-27', value: 143.66 },
	{ time: '2017-04-03', value: 143.34 },
	{ time: '2017-04-10', value: 141.05 },
	{ time: '2017-04-17', value: 142.27 },
	{ time: '2017-04-24', value: 143.65 },
	{ time: '2017-05-01', value: 148.96 },
	{ time: '2017-05-08', value: 156.1 },
	{ time: '2017-05-15', value: 153.06 },
	{ time: '2017-05-22', value: 153.61 },
	{ time: '2017-05-29', value: 155.45 },
	{ time: '2017-06-05', value: 148.98 },
	{ time: '2017-06-12', value: 142.27 },
	{ time: '2017-06-19', value: 146.28 },
	{ time: '2017-06-26', value: 144.02 },
	{ time: '2017-07-03', value: 144.18 },
	{ time: '2017-07-10', value: 149.04 },
	{ time: '2017-07-17', value: 150.27 },
	{ time: '2017-07-24', value: 149.5 },
	{ time: '2017-07-31', value: 156.39 },
	{ time: '2017-08-07', value: 157.48 },
	{ time: '2017-08-14', value: 157.5 },
	{ time: '2017-08-21', value: 159.86 },
	{ time: '2017-08-28', value: 164.05 },
	{ time: '2017-09-04', value: 158.63 },
	{ time: '2017-09-11', value: 159.88 },
	{ time: '2017-09-18', value: 151.89 },
	{ time: '2017-09-25', value: 154.12 },
	{ time: '2017-10-02', value: 155.3 },
	{ time: '2017-10-09', value: 156.99 },
	{ time: '2017-10-16', value: 156.25 },
	{ time: '2017-10-23', value: 163.05 },
	{ time: '2017-10-30', value: 172.5 },
	{ time: '2017-11-06', value: 174.67 },
	{ time: '2017-11-13', value: 170.15 },
	{ time: '2017-11-20', value: 174.97 },
	{ time: '2017-11-27', value: 171.05 },
	{ time: '2017-12-04', value: 169.37 },
	{ time: '2017-12-11', value: 173.97 },
	{ time: '2017-12-18', value: 175.01 },
	{ time: '2017-12-25', value: 169.23 },
	{ time: '2018-01-01', value: 175.0 },
	{ time: '2018-01-08', value: 177.09 },
	{ time: '2018-01-15', value: 178.46 },
	{ time: '2018-01-22', value: 171.51 },
	{ time: '2018-01-29', value: 160.5 },
	{ time: '2018-02-05', value: 156.41 },
	{ time: '2018-02-12', value: 172.43 },
	{ time: '2018-02-19', value: 175.5 },
	{ time: '2018-02-26', value: 176.21 },
	{ time: '2018-03-05', value: 179.98 },
	{ time: '2018-03-12', value: 178.02 },
	{ time: '2018-03-19', value: 164.94 },
	{ time: '2018-03-26', value: 167.78 },
	{ time: '2018-04-02', value: 168.38 },
	{ time: '2018-04-09', value: 174.73 },
	{ time: '2018-04-16', value: 165.72 },
	{ time: '2018-04-23', value: 162.32 },
	{ time: '2018-04-30', value: 183.83 },
	{ time: '2018-05-07', value: 188.59 },
	{ time: '2018-05-14', value: 186.31 },
	{ time: '2018-05-21', value: 188.58 },
	{ time: '2018-05-28', value: 190.24 },
	{ time: '2018-06-04', value: 191.7 },
	{ time: '2018-06-11', value: 188.84 },
	{ time: '2018-06-18', value: 184.92 },
	{ time: '2018-06-25', value: 185.11 },
	{ time: '2018-07-02', value: 187.97 },
	{ time: '2018-07-09', value: 191.33 },
	{ time: '2018-07-16', value: 191.44 },
	{ time: '2018-07-23', value: 190.98 },
	{ time: '2018-07-30', value: 207.99 },
	{ time: '2018-08-06', value: 207.53 },
	{ time: '2018-08-13', value: 217.58 },
	{ time: '2018-08-20', value: 216.16 },
	{ time: '2018-08-27', value: 227.63 },
	{ time: '2018-09-03', value: 221.3 },
	{ time: '2018-09-10', value: 223.84 },
	{ time: '2018-09-17', value: 217.66 },
	{ time: '2018-09-24', value: 225.74 },
	{ time: '2018-10-01', value: 224.29 },
	{ time: '2018-10-08', value: 222.11 },
	{ time: '2018-10-15', value: 219.31 },
	{ time: '2018-10-22', value: 216.3 },
	{ time: '2018-10-29', value: 207.48 },
	{ time: '2018-11-05', value: 204.47 },
	{ time: '2018-11-12', value: 193.53 },
	{ time: '2018-11-19', value: 172.29 },
	{ time: '2018-11-26', value: 178.58 },
	{ time: '2018-12-03', value: 168.49 },
	{ time: '2018-12-10', value: 165.48 },
	{ time: '2018-12-17', value: 150.73 },
	{ time: '2018-12-24', value: 156.23 },
	{ time: '2018-12-31', value: 148.26 },
	{ time: '2019-01-07', value: 152.29 },
	{ time: '2019-01-14', value: 156.82 },
	{ time: '2019-01-21', value: 157.76 },
	{ time: '2019-01-28', value: 166.52 },
	{ time: '2019-02-04', value: 170.41 },
	{ time: '2019-02-11', value: 170.42 },
	{ time: '2019-02-18', value: 172.97 },
	{ time: '2019-02-25', value: 174.97 },
	{ time: '2019-03-04', value: 172.91 },
	{ time: '2019-03-11', value: 186.12 },
	{ time: '2019-03-18', value: 191.05 },
	{ time: '2019-03-25', value: 189.95 },
	{ time: '2019-04-01', value: 197.0 },
	{ time: '2019-04-08', value: 198.87 },
	{ time: '2019-04-15', value: 203.86 },
	{ time: '2019-04-22', value: 204.3 },
	{ time: '2019-04-29', value: 211.75 },
	{ time: '2019-05-06', value: 197.18 },
	{ time: '2019-05-13', value: 189.0 },
	{ time: '2019-05-20', value: 178.97 },
	{ time: '2019-05-27', value: 179.03 },
	// hide-end
]);

// const symbolName = 'ETC USD 7D VWAP';

const container = document.getElementById('container');

function dateToString(date) {
	return `${date.year} - ${date.month} - ${date.day}`;
}

const toolTipWidth = 80;
const toolTipHeight = 80;
const toolTipMargin = 15;

// Create and style the tooltip html element
const toolTip = document.createElement('div');
toolTip.style = `width: 96px; height: 80px; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border: 1px solid; border-radius: 2px;font-family: 'Trebuchet MS', Roboto, Ubuntu, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`;
toolTip.style.background = CHART_BACKGROUND_COLOR;
toolTip.style.color = CHART_TEXT_COLOR;
toolTip.style.borderColor = BASELINE_TOP_LINE_COLOR;
container.appendChild(toolTip);

// update tooltip
chart.subscribeCrosshairMove(param => {
	if (
		param.point === undefined ||
		!param.time ||
		param.point.x < 0 ||
		param.point.x > container.clientWidth ||
		param.point.y < 0 ||
		param.point.y > container.clientHeight
	) {
		toolTip.style.display = 'none';
	} else {
		const dateStr = dateToString(param.time);
		toolTip.style.display = 'block';
		const price = param.seriesPrices.get(series);
		toolTip.innerHTML = `<div style="color: ${BASELINE_TOP_LINE_COLOR}">ABC Inc.</div><div style="font-size: 24px; margin: 4px 0px; color: ${CHART_TEXT_COLOR}">
			${Math.round(100 * price) / 100}
			</div><div style="color: ${CHART_TEXT_COLOR}">
			${dateStr}
			</div>`;

		// highlight-start
		const y = param.point.y;
		let left = param.point.x + toolTipMargin;
		if (left > container.clientWidth - toolTipWidth) {
			left = param.point.x - toolTipMargin - toolTipWidth;
		}

		let top = y + toolTipMargin;
		if (top > container.clientHeight - toolTipHeight) {
			top = y - toolTipHeight - toolTipMargin;
		}
		toolTip.style.left = left + 'px';
		toolTip.style.top = top + 'px';
		// highlight-end
	}
});

chart.timeScale().fitContent();
