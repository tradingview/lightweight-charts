/* eslint-env browser */
/* global LightweightCharts */
// Shared by the ordinary plugin graphics pages and the assertion runner.
// Checks are recorded, not thrown, so a failure still has a screenshot.
window.PluginTest = {
	checks: [],
	start(container, title) {
		window.ignoreMouseMove = true;
		container.style.font = '14px sans-serif';
		container.style.background = '#ffffff';
		container.style.color = '#111111';
		const heading = document.createElement('h2');
		heading.style.cssText = 'margin:12px;font-size:18px';
		heading.textContent = title;
		container.appendChild(heading);
		const host = document.createElement('div');
		host.style.cssText = 'width:100%;height:380px';
		container.appendChild(host);
		this.output = document.createElement('div');
		this.output.style.cssText = 'margin:12px;white-space:pre-wrap;overflow-wrap:anywhere';
		container.appendChild(this.output);
		return host;
	},
	chart: (host, options = {}) => (window.chart = LightweightCharts.createChart(host, {
		layout: { attributionLogo: false },
		width: host.clientWidth,
		height: host.clientHeight,
		...options,
	})),
	check(name, passed, actual, expected) {
		const check = { name, passed: Boolean(passed), actual, expected };
		this.checks.push(check);
		const row = document.createElement('div');
		row.style.color = passed ? '#137333' : '#b3261e';
		row.textContent = `${passed ? 'PASS' : 'FAIL'}: ${name}\nExpected: ${JSON.stringify(expected)}; actual: ${JSON.stringify(actual)}`;
		this.output.appendChild(row);
	},
	async frames(count = 3) {
		for (let i = 0; i < count; i++) {
			await new Promise(resolve => requestAnimationFrame(resolve));
		}
	},
	async until(predicate) {
		const deadline = performance.now() + 3000;
		while (!predicate()) {
			if (performance.now() > deadline) {
				throw new Error('Timed out waiting for the test precondition');
			}
			await this.frames(1);
		}
	},
	data: (count, point) => Array.from({ length: count }, (_, index) => ({
		time: 1704067200 + index * 86400,
		...point(index),
	})),
	pixels(chart, matches) {
		const canvas = chart.takeScreenshot();
		const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
		let count = 0;
		for (let i = 0; i < pixels.length; i += 4) {
			if (matches(pixels[i], pixels[i + 1], pixels[i + 2])) {
				count++;
			}
		}
		return count;
	},
	green(chart) {
		return this.pixels(chart, (r, g, b) => r < 80 && g > 180 && b < 80);
	},
};
