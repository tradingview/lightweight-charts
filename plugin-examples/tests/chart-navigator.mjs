/* eslint-env browser */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import puppeteer from 'puppeteer';

async function runBrowserChecks() {
	const root = path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		'../..'
	);
	const screenshots = process.env.NAVIGATOR_SCREENSHOT_DIR;
	const server = await createServer({
		root: path.join(root, 'plugin-examples'),
		configFile: false,
		server: {
			port: 0,
			fs: { allow: [root, fs.realpathSync(path.join(root, 'node_modules'))] },
		},
	});
	await server.listen();
	const address = server.httpServer.address();
	assert.ok(address && typeof address !== 'string');
	const origin = `http://localhost:${address.port}`;
	let browser;
	try {
		browser = await puppeteer.launch({
			headless: true,
			args: process.env.NO_SANDBOX === '1' ? ['--no-sandbox'] : [],
		});
	} catch (error) {
		await server.close();
		throw error;
	}
	const results = [];
	try {
		const page = await browser.newPage();
		const errors = [];
		page.on('pageerror', e => errors.push(e.message));
		await page.setViewport({ width: 1000, height: 850, deviceScaleFactor: 1 });
		const url = origin + '/src/plugins/chart-navigator/example/';
		await page.goto(url);
		await page.waitForSelector('.chart-navigator-move');
		await page.waitForFunction(
			() =>
				document.querySelector('.chart-navigator-move').getBoundingClientRect()
					.width > 100
		);
		if (screenshots) {
			fs.mkdirSync(screenshots, { recursive: true });
			await page.screenshot({
				path: path.join(screenshots, 'demo-desktop.png'),
			});
		}
		// Set up the reusable class with public chart APIs, independently of the demo's local variables.
		await page.evaluate(async repositoryRoot => {
			const { createChart, AreaSeries } = await import(
				`/@fs${repositoryRoot}/dist/lightweight-charts.development.mjs`
			);
			const { ChartNavigator } =
				await import('/src/plugins/chart-navigator/chart-navigator.ts');
			document.body.innerHTML =
				'<div id="main" style="height:300px"></div><div id="overview"></div>';
			const main = createChart('main', {
				autoSize: true,
				timeScale: {
					fixLeftEdge: true,
					fixRightEdge: true,
					minBarSpacing: 0.01,
					rightOffset: 0,
				},
			});
			const overview = createChart('overview', {
				autoSize: true,
				handleScale: false,
				handleScroll: false,
				leftPriceScale: { visible: false },
				rightPriceScale: { visible: false },
				timeScale: { minBarSpacing: 0.01, rightOffset: 0 },
			});
			const data = Array.from({ length: 300 }, (_, i) => ({
				time: 1704067200 + i * 86400,
				value: 100 + Math.sin(i / 10) * 10 + i / 10,
			}));
			const ms = main.addSeries(AreaSeries);
			const os = overview.addSeries(AreaSeries);
			ms.setData(data);
			os.setData(data);
			overview.timeScale().fitContent();
			main.timeScale().setVisibleLogicalRange({ from: 100, to: 180 });
			const nav = new ChartNavigator(
				main,
				overview,
				document.getElementById('overview'),
				data.length
			);
			window.test = { main, overview, ms, os, nav, ChartNavigator };
		}, root);
		const settle = () =>
			page.evaluate(
				() =>
					new Promise(r =>
						requestAnimationFrame(() => requestAnimationFrame(r))
					)
			);
		const range = () =>
			page.evaluate(() =>
				window.test.main.timeScale().getVisibleLogicalRange()
			);
		const set = async (initialFrom, initialTo) => {
			await page.evaluate(
				(from, to) =>
					window.test.main.timeScale().setVisibleLogicalRange({ from, to }),
				initialFrom,
				initialTo
			);
			await settle();
		};
		const box = sel =>
			page.$eval(sel, el => {
				const r = el.getBoundingClientRect();
				return { x: r.x, y: r.y, width: r.width, height: r.height };
			});
		const drag = async (sel, dx) => {
			const b = await box(sel);
			await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
			await page.mouse.down();
			await page.mouse.move(b.x + b.width / 2 + dx, b.y + b.height / 2, {
				steps: 8,
			});
			await page.mouse.up();
			await settle();
		};
		const near = (x, y, tol = 0.6) =>
			assert.ok(Math.abs(x - y) < tol, `${x} != ${y}`);
		await settle();
		let r = await range();
		near(r.from, 100);
		near(r.to, 180);
		results.push('initial range');
		const moveBounds = await page.$eval('.chart-navigator-move', el => ({
			min: Number(el.getAttribute('aria-valuemin')),
			max: Number(el.getAttribute('aria-valuemax')),
			now: Number(el.getAttribute('aria-valuenow')),
		}));
		assert.deepEqual(moveBounds, { min: 40, max: 259, now: 140 });
		results.push('move slider advertises reachable midpoint bounds');
		// Keep the actual chart branding link clickable even under a selection.
		const logo = await page.$eval(
			'#overview a[href^="https://www.tradingview.com/"]',
			el => {
				const rect = el.getBoundingClientRect();
				return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
			}
		);
		await set(0, 80);
		const logoIsHit = await page.evaluate(({ x, y }) => {
			const link = document.elementFromPoint(x, y)?.closest('a');
			return (
				link !== null &&
				link !== undefined &&
				new URL(link.href).hostname === 'www.tradingview.com'
			);
		}, logo);
		assert.equal(logoIsHit, true);
		// Prevent external navigation in this test while checking a real mouse click.
		await page.evaluate(() => {
			window.logoClicks = 0;
			document
				.querySelector('#overview a[href^="https://www.tradingview.com/"]')
				.addEventListener(
					'click',
					event => {
						event.preventDefault();
						window.logoClicks++;
					},
					{ once: true }
				);
		});
		await page.mouse.click(logo.x, logo.y);
		assert.equal(await page.evaluate(() => window.logoClicks), 1);
		const logoRange = await range();
		near(logoRange.from, 0);
		near(logoRange.to, 80);
		results.push(
			'overview attribution receives pointer click without moving range'
		);
		await set(100, 180);
		const width = (await box('.chart-navigator')).width;
		await drag('.chart-navigator-from', (width * 20) / 300);
		r = await range();
		near(r.from, 120);
		near(r.to, 180);
		results.push('left handle resize');
		await drag('.chart-navigator-to', (width * 20) / 300);
		r = await range();
		near(r.from, 120);
		near(r.to, 200);
		results.push('right handle resize');
		await drag('.chart-navigator-move', (-width * 30) / 300);
		r = await range();
		near(r.from, 90);
		near(r.to, 170);
		results.push('window pan preserves span');
		const b = await box('.chart-navigator');
		await page.mouse.click(b.x + width * 0.85, b.y + 10);
		await settle();
		r = await range();
		near(r.to - r.from, 80);
		near((r.from + r.to) / 2, 254.5, 1);
		results.push('outside click recenters with same span');
		await set(100, 180);
		await page.focus('.chart-navigator-from');
		await page.keyboard.press('ArrowRight');
		await settle();
		r = await range();
		near(r.from, 101);
		near(r.to, 180);
		results.push('keyboard handle');
		await page.focus('.chart-navigator-move');
		await page.keyboard.down('Shift');
		await page.keyboard.press('ArrowLeft');
		await page.keyboard.up('Shift');
		await settle();
		r = await range();
		near(r.from, 91);
		near(r.to, 170);
		results.push('keyboard window with shift');
		await page.keyboard.press('Home');
		await settle();
		r = await range();
		near(r.from, 0);
		await page.keyboard.press('End');
		await settle();
		r = await range();
		near(r.to, 299);
		results.push('Home and End');
		await set(100, 180);
		await drag('.chart-navigator-from', width);
		r = await range();
		near(r.to - r.from, 1);
		results.push('minimum span at handle crossing');
		await drag('.chart-navigator-from', (-width * 20) / 300);
		r = await range();
		assert.ok(r.to - r.from > 20);
		results.push('both handles reachable at minimum span');
		await set(100, 180);
		await drag('.chart-navigator-move', -width);
		r = await range();
		near(r.from, 0);
		near(r.to, 80);
		results.push('left boundary');
		await set(100, 180);
		await drag('.chart-navigator-move', width);
		r = await range();
		near(r.from, 219);
		near(r.to, 299);
		results.push('right boundary');
		await set(100.25, 180.75);
		const mainBox = await box('#main');
		await page.mouse.move(mainBox.x + 250, mainBox.y + 100);
		await page.mouse.down();
		await page.mouse.move(mainBox.x + 280, mainBox.y + 100, { steps: 8 });
		await page.mouse.up();
		await settle();
		const panned = await range();
		assert.ok(Math.abs(panned.from - 100.25) > 1);
		const selectedFrom = await page.$eval('.chart-navigator-from', el =>
			Number(el.getAttribute('aria-valuenow'))
		);
		near(panned.from, selectedFrom, 0.01);
		results.push('native main-chart drag with fractional range');
		await set(30, 90);
		let state = await page.evaluate(() => ({
			from: Number(
				document
					.querySelector('.chart-navigator-from')
					.getAttribute('aria-valuenow')
			),
			to: Number(
				document
					.querySelector('.chart-navigator-to')
					.getAttribute('aria-valuenow')
			),
		}));
		assert.deepEqual(state, { from: 30, to: 90 });
		results.push('external chart range updates overlay');
		await set(150.25, 230.75);
		await page.setViewport({ width: 380, height: 750, deviceScaleFactor: 2 });
		await settle();
		await settle();
		state = await page.evaluate(() => ({
			overlay: document
				.querySelector('.chart-navigator')
				.getBoundingClientRect().width,
			scale: window.test.overview.timeScale().width(),
		}));
		near(state.overlay, state.scale, 1);
		const overviewRange = await page.evaluate(() =>
			window.test.overview.timeScale().getVisibleLogicalRange()
		);
		near(overviewRange.from, 0);
		near(overviewRange.to, 299);
		const mapping = await page.evaluate(() => {
			const current = window.test.main.timeScale().getVisibleLogicalRange();
			const scale = window.test.overview.timeScale();
			return {
				current,
				x:
					scale.logicalToCoordinate(0) +
					((scale.logicalToCoordinate(299) - scale.logicalToCoordinate(0)) *
						current.from) /
						299,
				left: parseFloat(
					document.querySelector('.chart-navigator-from').style.left
				),
				right: parseFloat(
					document.querySelector('.chart-navigator-to').style.left
				),
				endX:
					scale.logicalToCoordinate(0) +
					((scale.logicalToCoordinate(299) - scale.logicalToCoordinate(0)) *
						current.to) /
						299,
			};
		});
		near(mapping.x, mapping.left, 1);
		near(mapping.endX, mapping.right, 1);
		assert.ok(mapping.current.from > 0);
		results.push('responsive DPR2 fractional endpoints and full dataset');
		if (screenshots) {
			await page.screenshot({
				path: path.join(screenshots, 'controls-narrow-dpr2.png'),
			});
		}
		await page.evaluate(() => window.test.nav.remove());
		assert.equal(await page.$('.chart-navigator'), null);
		await set(60, 120);
		results.push('remove detaches DOM and subscriptions');
		await page.evaluate(() => {
			window.test.nav = new window.test.ChartNavigator(
				window.test.main,
				window.test.overview,
				document.getElementById('overview'),
				300
			);
		});
		await settle();
		const touch = await page.createCDPSession();
		const tb = await box('.chart-navigator-move');
		await touch.send('Input.dispatchTouchEvent', {
			type: 'touchStart',
			touchPoints: [{ x: tb.x + tb.width / 2, y: tb.y + tb.height / 2 }],
		});
		await touch.send('Input.dispatchTouchEvent', {
			type: 'touchMove',
			touchPoints: [{ x: tb.x + tb.width / 2 + 20, y: tb.y + tb.height / 2 }],
		});
		await touch.send('Input.dispatchTouchEvent', {
			type: 'touchEnd',
			touchPoints: [],
		});
		await settle();
		r = await range();
		assert.ok(r.from > 60);
		near(r.to - r.from, 60);
		results.push('real touch drag');
		// Ensure cancellation leaves the component usable.
		const tc = await box('.chart-navigator-move');
		await touch.send('Input.dispatchTouchEvent', {
			type: 'touchStart',
			touchPoints: [{ x: tc.x + tc.width / 2, y: tc.y + tc.height / 2 }],
		});
		await touch.send('Input.dispatchTouchEvent', {
			type: 'touchCancel',
			touchPoints: [],
		});
		await page.focus('.chart-navigator-move');
		await page.keyboard.press('ArrowRight');
		await settle();
		const afterCancel = await range();
		near(afterCancel.from, r.from + 1);
		results.push('touch cancellation then keyboard');
		await page.evaluate(() => {
			window.test.nav.remove();
			window.test.nav.remove();
			window.test.main.remove();
			window.test.overview.remove();
		});
		results.push('idempotent disposal before chart removal');
		assert.deepEqual(errors, []);
		results.push('no browser errors');
		process.stdout.write(
			`${JSON.stringify({ checks: results.length, results }, null, 2)}\n`
		);
	} finally {
		await browser.close();
		await server.close();
	}
}

runBrowserChecks().catch(error => {
	process.stderr.write(`${error.stack ?? error}\n`);
	process.exitCode = 1;
});
