window.ignoreMouseMove = true;
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

function runTestCase(container) {
	const box = document.createElement('div');
	box.style.position = 'absolute';
	box.style.top = 0;
	box.style.left = 0;
	box.style.width = '200px';
	box.style.height = '200px';
	container.appendChild(box);

	const chart = LightweightCharts.createChart(box, { autoSize: true, height: 200, width: 200, layout: { attributionLogo: false } });
	const mainSeries = chart.addAreaSeries();

	mainSeries.setData(generateData());

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			// remove autoSize
			chart.applyOptions({ autoSize: false });
			box.style.height = '225px';
			requestAnimationFrame(() => {
				// enable autoSize again.
				// This test case is checking that you can have autoSize enabled, then removed, and then re-added again
				chart.applyOptions({ autoSize: true });
				box.style.height = '250px';
				setTimeout(resolve, 300);
			});
		});
	});
}
