class PaneLabel {
	constructor(text, color) {
		this._text = text;
		this._color = color;
		this._attached = false;
	}

	attached() {
		this._attached = true;
	}

	detached() {
		this._attached = false;
	}

	paneViews() {
		return this._attached ? [this] : [];
	}

	renderer() {
		return this;
	}

	draw(target) {
		target.useMediaCoordinateSpace(({ context }) => {
			context.fillStyle = this._color;
			context.fillRect(30, 25, 220, 55);
			context.fillStyle = 'white';
			context.font = '20px Arial';
			context.fillText(this._text, 40, 60);
		});
	}
}

async function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });
	const series = [0, 1, 2].map(i => chart.addSeries(LightweightCharts.LineSeries, {}, i));
	series.forEach(line => line.setData([{ time: 1, value: 10 }, { time: 2, value: 20 }]));
	chart.panes().forEach((pane, i) => pane.attachPrimitive(new PaneLabel(`Original pane ${i}`, ['#00695c', '#b71c1c', '#1565c0'][i])));
	await new Promise(resolve => requestAnimationFrame(resolve));
	chart.removePane(1);
	await new Promise(resolve => requestAnimationFrame(resolve));
                                        }
