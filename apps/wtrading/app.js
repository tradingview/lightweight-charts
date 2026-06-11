/*
 * WTrading — chart + formulas of the difference-quotient theory.
 * Uses lightweight-charts v5 (standalone build, window.LightweightCharts).
 */
(function() {
	'use strict';

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

	// ---- demo candle data (deterministic pseudo-random walk) ----
	function generateCandles(count) {
		let seed = 42;
		const rnd = () => {
			seed = (seed * 16807) % 2147483647;
			return seed / 2147483647;
		};
		const candles = [];
		let price = 0.85;
		const day = 86400;
		const start = Math.floor(Date.UTC(2026, 0, 1) / 1000);
		for (let i = 0; i < count; i++) {
			const drift = Math.sin(i / 14) * 0.0009 + (rnd() - 0.48) * 0.0014;
			const open = price;
			const close = price + drift;
			const high = Math.max(open, close) + rnd() * 0.0008;
			const low = Math.min(open, close) - rnd() * 0.0008;
			candles.push({ time: start + i * day, open, high, low, close });
			price = close;
		}
		return candles;
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

	// theory threshold: differential quotients staying above/below this value
	// signal continuation to the next fibonacci level
	const THRESHOLD = 0.5;

	// ---- theory: find t0 (low, f' crosses 0 upward) and t1 (f' reaches 1) ----
	function analyze(candles, ma) {
		// Normalizes the raw price-per-bar slope of this demo data (~0.00025/bar)
		// into the 0..1 regime of the theory, so "crosses 1" and "0.5" rules apply.
		const SCALE = 4000;
		const diff = differential(ma, SCALE);
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
			f1: differenceQuotient(c0.low, c1.close, bars, SCALE),
			// 2. difference quotient at t0
			f2: differenceQuotient(c0.low, candles[t0 + maOffset + 1].close, 1, SCALE),
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

	// ---- chart setup ----
	const LWC = window.LightweightCharts;
	const host = document.getElementById('chart');
	if (!LWC || !host) {
		if (host) {
			host.innerHTML = '<p style="padding:16px;color:#ef5350">lightweight-charts konnte nicht geladen werden.</p>';
		}
		return;
	}

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

	const candles = generateCandles(140);
	const ma = movingAverage(candles, 9);

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

	const result = analyze(candles, ma);

	// ray line t0 → t1, extended to the right edge
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
	document.getElementById('f5').textContent = fmt(result.f5) + (Math.abs(result.f5) > THRESHOLD ? ' → weiter' : '');
	document.getElementById('f6').textContent = fmt(result.f6) + (Math.abs(result.f6) > THRESHOLD ? ' → nächstes Fib' : '');
	document.getElementById('f7').textContent = result.extrema.length + ' Extrema';

	const signalCard = document.getElementById('signalCard');
	const signalOut = document.getElementById('signal');
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

	// ---- live simulation: extend the last bar ----
	let last = candles[candles.length - 1];
	setInterval(() => {
		const delta = (Math.random() - 0.5) * 0.0004;
		const close = last.close + delta;
		last = {
			time: last.time,
			open: last.open,
			high: Math.max(last.high, close),
			low: Math.min(last.low, close),
			close,
		};
		candleSeries.update(last);
	}, 1500);
})();
