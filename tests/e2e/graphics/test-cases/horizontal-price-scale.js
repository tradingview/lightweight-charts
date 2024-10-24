function markWithGreaterWeight(a, b) {
	return a.weight > b.weight ? a : b;
}

class HorzScaleBehaviorPrice {
	options() {}
	setOptions() {}
	preprocessData() {}
	updateFormatter() {}
	createConverterToInternalObj() {
		return price => price;
	}

	key(item) {
		return item;
	}

	cacheKey(item) {
		return item;
	}

	convertHorzItemToInternal(item) {
		return item;
	}

	formatHorzItem(item) {
		const tp = item;
		return tp.toFixed(2);
	}

	formatTickmark(tickMark) {
		return tickMark.time.toFixed(2);
	}

	maxTickMarkWeight(tickMarks) {
		return tickMarks.reduce(markWithGreaterWeight, tickMarks[0]).weight;
	}

	fillWeightsForPoints(sortedTimePoints, startIndex) {
		const priceWeight = price => {
			if (price === Math.ceil(price / 100) * 100) {
				return 8;
			}
			if (price === Math.ceil(price / 50) * 50) {
				return 7;
			}
			if (price === Math.ceil(price / 25) * 25) {
				return 6;
			}
			if (price === Math.ceil(price / 10) * 10) {
				return 5;
			}
			if (price === Math.ceil(price / 5) * 5) {
				return 4;
			}
			if (price === Math.ceil(price)) {
				return 3;
			}
			if (price * 2 === Math.ceil(price * 2)) {
				return 1;
			}
			return 0;
		};
		for (let index = startIndex; index < sortedTimePoints.length; ++index) {
			sortedTimePoints[index].timeWeight = priceWeight(
				sortedTimePoints[index].time
			);
		}
	}
}

function runTestCase(container) {
	const horzItemBehavior = new HorzScaleBehaviorPrice();
	const chart = (window.chart = LightweightCharts.createChartEx(
		container,
		horzItemBehavior,
		{ layout: { attributionLogo: false } }
	));
	const s1 = chart.addLineSeries({
		color: 'red',
	});
	const arr = [];
	for (let i = 0; i < 5000; i++) {
		arr.push({
			time: i * 0.25,
			value: Math.round(i / 10),
		});
	}
	s1.setData(arr);
}
