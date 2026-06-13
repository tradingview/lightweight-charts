/*
 * WTrading — chart + formulas of the difference-quotient theory.
 * Uses lightweight-charts v5 (standalone build, window.LightweightCharts).
 * Market data: Kraken public REST API (no authentication required).
 */
(function() {
	'use strict';

	// ---- data source configuration ----
	const CONFIG = {
		pair: 'USDCEUR',
		interval: 1440, // minutes per bar: 1440 = 1D
		displayName: 'USDC / EUR',
		intervalLabel: '1D',
		maPeriod: 9,
		pollMs: 60000, // live poll interval in ms
	};

	const COLORS = {
		green: '#3ddc84',
		greenSoft: '#26a69a',
		orange: '#ff9800',
		blue: '#4cc2ff',
		blueAccent: '#0078d4',
		red: '#ef5350',
		text: 'rgba(255,255,255,0.7)',
		grid: 'rgba(255,255,255,0.06)',
	};

	const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618, 2.618];

	// ---- Kraken public REST: fetch OHLC bars ----
	const mapKrakenRow = r => ({ time: r[0], open: +r[1], high: +r[2], low: +r[3], close: +r[4] });

	async function fetchKrakenOHLC(pair, interval) {
		const url = 'https://api.kraken.com/0/public/OHLC?pair=' + pair + '&interval=' + interval;
		let resp;
		try {
			resp = await fetch(url);
		} catch (err) {
			throw new Error('Netzwerkfehler: ' + err.message);
		}
		if (!resp.ok) { throw new Error('HTTP ' + resp.status); }
		const json = await resp.json();
		if (json.error && json.error.length) { throw new Error(json.error[0]); }
		// result contains the pair data array and a "last" timestamp key
		const rows = Object.values(json.result).find(v => Array.isArray(v));
		if (!rows || rows.length < 2) { throw new Error('Keine Daten f\u00fcr ' + pair); }
		// Kraken includes the current incomplete bar as the last row — keep it for live display
		return rows.map(mapKrakenRow);
	}

	// ---- math: moving average + quotients ----
	function movingAverage(candles, period) {
		const out = [];
		let sum = 0;
		for (let i = 0; i < candles.length; i++) {
			sum += candles[i].close;
			if (i >= period) { sum -= candles[i - period].close; }
			if (i >= period - 1) {
				out.push({ time: candles[i].time, value: sum / period });
			}
		}
		return out;
	}

	// difference quotient between two points (slope normalized per bar, scaled)
	function differenceQuotient(p0, p1, barsBetween, scale) {
		if (!barsBetween) { return 0; }
		return ((p1 - p0) / barsBetween) * scale;
	}

	// numerical differential quotient series of a line (per bar, scaled)
	function differential(line, scale) {
		const out = [];
		for (let i = 1; i < line.length; i++) {
			out.push({ time: line[i].time, value: (line[i].value - line[i - 1].value) * scale });
		}
		return out;
	}

	// average differential over a slice
	function avgDifferential(diff, from, to) {
		const slice = diff.slice(Math.max(0, from), Math.max(0, to));
		if (!slice.length) { return 0; }
		return slice.reduce((a, p) => a + p.value, 0) / slice.length;
	}

	// auto-scale: map average absolute bar change to 0.5 so threshold math is data-independent
	function computeScale(ma) {
		let sum = 0;
		for (let i = 1; i < ma.length; i++) {
			sum += Math.abs(ma[i].value - ma[i - 1].value);
		}
		const avg = sum / (ma.length - 1) || 1e-9;
		return 0.5 / avg;
	}

	// theory threshold: differential quotients staying above/below this value
	// signal continuation to the next fibonacci level
	const THRESHOLD = 0.5;

	// ---- theory: find t0 (low, f' crosses 0 upward) and t1 (f' reaches 1) ----
	function analyze(candles, ma) {
		// Scale normalizes bar-to-bar slopes so that an average move maps to 0.5
		// and the "f' \u2265 1" breakout condition is ~2\u00d7 the average daily move.
		const scale = computeScale(ma);
		const diff = differential(ma, scale);
		const maOffset = candles.length - ma.length;

		let t0 = -1; // index into ma
		let t1 = -1;
		for (let i = 1; i < diff.length; i++) {
			if (t0 === -1 && diff[i - 1].value <= 0 && diff[i].value > 0) {
				t0 = i; // low: differential quotient crosses 0
			} else if (t0 !== -1 && diff[i].value >= 1) {
				t1 = i; // differential quotient reaches 1
				break;
			}
		}
		if (t0 === -1) { t0 = 1; }
		if (t1 === -1) { t1 = Math.min(t0 + 20, diff.length - 1); }

		const c0 = candles[t0 + maOffset];
		const c1 = candles[t1 + maOffset];
		const bars = (t1 - t0) || 1;
		const up = c1.close >= c0.low;
		const legLow = Math.min(c0.low, c1.low);
		const legHigh = Math.max(c0.high, c1.high);
		const legSize = legHigh - legLow || 1e-9;

		// t2: target price at the next fib level (1.618 extension in trend direction)
		const t2Price = up ? legLow + legSize * 1.618 : legHigh - legSize * 1.618;

		const oneThirdEnd = t1 + Math.max(1, Math.round(bars / 3));
		const zeroNineLen = Math.max(1, Math.round(bars * 0.09));

		// extrema markers: every f' zero crossing
		const extrema = [];
		for (let i = 1; i < diff.length; i++) {
			const a = diff[i - 1].value;
			const b = diff[i].value;
			if ((a <= 0 && b > 0) || (a >= 0 && b < 0)) {
				extrema.push({ time: diff[i].time, low: a <= 0 && b > 0 });
			}
		}

		return {
			diff, maOffset, t0, t1, c0, c1, bars, up, legLow, legHigh, legSize, t2Price, extrema,
			// 1. difference quotient t0→t1
			f1: differenceQuotient(c0.low, c1.close, bars, scale),
			// 2. difference quotient at t0
			f2: differenceQuotient(c0.low, candles[t0 + maOffset + 1].close, 1, scale),
			// 3. live differential quotient of MA
			f3: diff[diff.length - 1].value,
			// 4. differential quotient at t1
			f4: diff[t1].value,
			// 5. differential quotient ⅓ way
			f5: avgDifferential(diff, t1, oneThirdEnd),
			// 6. differential quotient of 0.09 length
			f6: avgDifferential(diff, diff.length - zeroNineLen, diff.length),
			// 7. low/high detector value
			f7: extrema.length ? diff[diff.length - 1].value : 0,
		};
	}

	// ---- UI helpers ----
	function showError(host, msg) {
		host.innerHTML = '<p style="padding:16px;color:#ef5350">' + msg + '</p>';
	}

	function showLoading(host) {
		host.innerHTML = '<p style="padding:16px;color:rgba(255,255,255,0.5)">Marktdaten werden geladen\u2026</p>';
	}

	// ---- chart setup ----
	function buildChart(LWC, host, candles) {
		host.innerHTML = '';
		const chart = LWC.createChart(host, {
			autoSize: true,
			layout: {
				background: { type: 'solid', color: 'transparent' },
				textColor: COLORS.text,
				fontFamily: '"Segoe UI", system-ui, sans-serif',
			},
			grid: {
				vertLines: { color: COLORS.grid },
				horzLines: { color: COLORS.grid },
			},
			crosshair: {
				vertLine: { color: COLORS.blue, labelBackgroundColor: COLORS.blueAccent },
				horzLine: { color: COLORS.blue, labelBackgroundColor: COLORS.blueAccent },
			},
			timeScale: { borderColor: 'rgba(255,255,255,0.12)' },
			rightPriceScale: { borderColor: 'rgba(255,255,255,0.12)' },
		});

		const ma = movingAverage(candles, CONFIG.maPeriod);
		const result = analyze(candles, ma);

		const candleSeries = chart.addSeries(LWC.CandlestickSeries, {
			upColor: COLORS.greenSoft,
			downColor: COLORS.red,
			borderUpColor: COLORS.greenSoft,
			borderDownColor: COLORS.red,
			wickUpColor: COLORS.greenSoft,
			wickDownColor: COLORS.red,
		});
		candleSeries.setData(candles);

		const maSeries = chart.addSeries(LWC.LineSeries, {
			color: COLORS.blue,
			lineWidth: 2,
			priceLineVisible: false,
			lastValueVisible: false,
		});
		maSeries.setData(ma);

		const raySeries = chart.addSeries(LWC.LineSeries, {
			color: COLORS.orange,
			lineWidth: 1,
			lineStyle: LWC.LineStyle.Dashed,
			priceLineVisible: false,
			lastValueVisible: false,
			crosshairMarkerVisible: false,
		});
		const slopePerBar = (result.c1.close - result.c0.low) / result.bars;
		const i0 = result.t0 + result.maOffset;
		const rayData = [];
		for (let i = i0; i < candles.length; i++) {
			rayData.push({ time: candles[i].time, value: result.c0.low + slopePerBar * (i - i0) });
		}
		raySeries.setData(rayData);

		// fibonacci price lines on the candle series
		let fibLines = [];
		function paintFib() {
			fibLines = FIB_LEVELS.map(level => candleSeries.createPriceLine({
				price: result.up
					? result.legLow + result.legSize * level
					: result.legHigh - result.legSize * level,
				color: level === 1.618 ? COLORS.blue : (level === 0.5 ? COLORS.green : COLORS.orange),
				lineWidth: level === 1.618 ? 2 : 1,
				lineStyle: LWC.LineStyle.Dotted,
				axisLabelVisible: true,
				title: String(level),
			}));
		}
		function clearFib() {
			fibLines.forEach(line => candleSeries.removePriceLine(line));
			fibLines = [];
		}
		paintFib();

		// t0/t1/t2 dot markers + extrema markers
		const baseMarkers = [
			{ time: result.c0.time, position: 'belowBar', color: COLORS.green, shape: 'circle', text: 't0' },
			{ time: result.c1.time, position: 'aboveBar', color: COLORS.orange, shape: 'circle', text: 't1' },
			{
				time: candles[candles.length - 1].time,
				position: result.up ? 'belowBar' : 'aboveBar',
				color: COLORS.blue,
				shape: result.up ? 'arrowUp' : 'arrowDown',
				text: 't2 ' + result.t2Price.toFixed(4),
			},
		];
		const extremaMarkers = result.extrema.map(e => ({
			time: e.time,
			position: e.low ? 'belowBar' : 'aboveBar',
			color: e.low ? COLORS.green : COLORS.orange,
			shape: 'circle',
			size: 0.6,
		}));
		const markers = LWC.createSeriesMarkers(candleSeries, baseMarkers);

		chart.timeScale().fitContent();

		// ---- formula readouts ----
		const fmt = v => (v >= 0 ? '+' : '') + v.toFixed(3);
		document.getElementById('f1').textContent = fmt(result.f1);
		document.getElementById('f2').textContent = fmt(result.f2);
		document.getElementById('f3').textContent = fmt(result.f3);
		document.getElementById('f4').textContent = fmt(result.f4);
		document.getElementById('f5').textContent = fmt(result.f5) + (Math.abs(result.f5) > THRESHOLD ? ' \u2192 weiter' : '');
		document.getElementById('f6').textContent = fmt(result.f6) + (Math.abs(result.f6) > THRESHOLD ? ' \u2192 n\u00e4chstes Fib' : '');
		document.getElementById('f7').textContent = result.extrema.length + ' Extrema';

		const signalCard = document.getElementById('signalCard');
		const signalOut = document.getElementById('signal');
		signalCard.classList.remove('buy', 'sell');
		signalCard.classList.add(result.up ? 'buy' : 'sell');
		signalOut.textContent = (result.up ? 'BUY @ ' : 'SELL @ ') + result.t2Price.toFixed(4);

		// ---- paint toggles ----
		document.getElementById('toggleRay').addEventListener('change', e => {
			raySeries.applyOptions({ visible: e.target.checked });
		});
		document.getElementById('toggleFib').addEventListener('change', e => {
			if (e.target.checked) { paintFib(); } else { clearFib(); }
		});
		function refreshMarkers() {
			const showDots = document.getElementById('toggleDots').checked;
			const showExtrema = document.getElementById('toggleExtrema').checked;
			const list = []
				.concat(showDots ? baseMarkers : [])
				.concat(showExtrema ? extremaMarkers : [])
				.sort((a, b) => a.time - b.time);
			markers.setMarkers(list);
		}
		document.getElementById('toggleDots').addEventListener('change', refreshMarkers);
		document.getElementById('toggleExtrema').addEventListener('change', refreshMarkers);

		return candleSeries;
	}

	// ---- live polling: update last bar, add new bar on period rollover ----
	function startLivePolling(candleSeries, initialCandles) {
		let lastTime = initialCandles[initialCandles.length - 1].time;
		setInterval(async () => {
			let fresh;
			try {
				fresh = await fetchKrakenOHLC(CONFIG.pair, CONFIG.interval);
			} catch (e) {
				return; // silent on poll errors — historical data was already loaded
			}
			if (!fresh.length) { return; }
			const newBar = fresh[fresh.length - 1];
			if (newBar.time !== lastTime) {
				// period rolled over: commit the now-complete previous bar first
				const prevBar = fresh[fresh.length - 2];
				if (prevBar && prevBar.time === lastTime) {
					candleSeries.update(prevBar);
				}
				candleSeries.update(newBar);
				lastTime = newBar.time;
			} else {
				candleSeries.update(newBar);
			}
		}, CONFIG.pollMs);
	}

	// ---- entry point ----
	async function init() {
		const LWC = window.LightweightCharts;
		const host = document.getElementById('chart');
		if (!LWC || !host) {
			if (host) { showError(host, 'lightweight-charts konnte nicht geladen werden.'); }
			return;
		}

		// update symbol pill from config
		document.getElementById('symbolPill').textContent =
			CONFIG.displayName + ' \u00b7 ' + CONFIG.intervalLabel;

		showLoading(host);

		let candles;
		try {
			candles = await fetchKrakenOHLC(CONFIG.pair, CONFIG.interval);
		} catch (e) {
			showError(host, 'Marktdaten konnten nicht geladen werden: ' + e.message);
			return;
		}

		const candleSeries = buildChart(LWC, host, candles);
		startLivePolling(candleSeries, candles);
	}

	init();
})();
