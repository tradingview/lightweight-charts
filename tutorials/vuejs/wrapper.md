# Vue.js - Wrapper Component

:::info

The following describes a relatively simple example that only allows for a
single [series](https://tradingview.github.io/lightweight-charts/docs/series-types.md) to be rendered. This example can be used as
a starting point and could be tweaked further using our extensive
[API](https://tradingview.github.io/lightweight-charts/docs/api).

**Please note: this example is intended to be used with Vue.js 3**

:::

This guide will focus on the key concepts required to get Lightweight Charts™
running within a Vue component. Please note this guide is not intended as a
complete step-by-step tutorial. The example Vue components can be found at the
[bottom](#complete-sample-code) of this guide.

If you are new to Vue.js then please have a look at the
[official Vue.js tutorials](https://vuejs.org/guide/introduction.html) before
proceeding further with this example.

## About the example wrapper component

The example Vue wrapper component has the following features.

The ability to:

- specify the series type via a component attribute,
- specify the series data via a component property,
- control the chart, series, time scale, and price scale options via properties,
- enable automatic resizing of the chart when the browser is resized.

The example may not fit your requirements completely. Creating a general-purpose
declarative wrapper for Lightweight Charts™ imperative API is a challenge, but
hopefully, you can adapt this example to your use case.

### Component showcase

Presented below is the finished wrapper component which is discussed throughout
this guide. The interactive buttons beneath the chart are showcasing how to
interact with the component and that code is provided below as well (within the
example app component).

### Vue API styles

Vue components can be authored in two different
[API styles](https://vuejs.org/guide/introduction.html#api-styles): _Options
API_ and _Composition API_.

This example will make use of the **Composition API**, but complete code
examples for both APIs will be presented at the end of the tutorial.

The Vue component could be used within any Vue setup, you can learn more on the
Vue documentation site:
[Ways of Vue](https://vuejs.org/guide/extras/ways-of-using-vue.html)

## Integrating Lightweight Charts™ with Vue

### Avoid using `Refs` for storing API instances

The preferred way to store a reference to the created chart
([IChartApi](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi) instance), or any other of the
library's instances, is to make use of a plain JS variable or class field
instead of using Vue's [`ref`](https://vuejs.org/api/reactivity-core.html#ref)
functionality.

When Vue wraps an object in a reference object, it modifies the object (to
enable reactivity) in such a way that it interferes with the internal logic of
the Lightweight Charts™. This can lead to unexpected behaviour. If you really need
to use a [`ref`](https://vuejs.org/api/reactivity-core.html#ref) then please
consider using
[`shallowRef`](https://vuejs.org/api/reactivity-advanced.html#shallowref)
instead.

We can instead create a variable to hold these instances outside of any vue
hooks (such as
[`onMounted`](https://vuejs.org/api/composition-api-lifecycle.html#onmounted),
[`watch`](https://vuejs.org/api/reactivity-core.html#watch)) within the body of
the script.

```html
<script setup>
    import { onMounted } from 'vue';

    // variable to store the created chart instance
    let chart;

    onMounted() {
        // ...
    }
</script>
```

### Use the `onMounted` lifecycle hook to create the chart

Lightweight Charts™ requires an html element to use as its container, you can
create a simple div element within the component's `template` and ask Vue to
create a reference to that element by adding the `ref="chartContainer"`
attribute to the div element and the corresponding variable within the script
section: `const chartContainer = ref();`

The ideal time to create the chart is during the `mounted` lifecycle hook
provided by the Vue component. The container div will be created and ready for
use at this stage. Within the
[`onMounted`](https://vuejs.org/api/composition-api-lifecycle.html#onmounted)
hook we can call Lightweight Charts™ [`createChart`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createChart)
constructor and pass it the value of the container reference (which is the div
element).

:::tip

Remember to also clean up when the component is unmounted
([`onUnmounted`](https://vuejs.org/api/composition-api-lifecycle.html#onunmounted)
hook) by calling the [`remove`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#remove) method on
the saved chart instance.

:::

```html
<script setup>
    import { onMounted, ref } from 'vue';
    import { createChart } from 'lightweight-charts';

    let chart;
    const chartContainer = ref();

    onMounted(() => {
        // Create the Lightweight Charts Instance using the container ref.
        chart = createChart(chartContainer.value);
    });

    onUnmounted(() => {
        if (chart) {
            chart.remove();
            chart = null;
        }
    });
</script>
<template>
    <div class="lw-chart" ref="chartContainer"></div>
</template>
<style scoped>
    .lw-chart {
        height: 100%;
    }
</style>
```

### Providing option properties

A simple way to provide customisation of the chart to the component's consumers
is to create component properties for the options you wish to be customised.
Lightweight Charts™ has a variety of customisation options which can be applied
through the [`applyOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#applyoptions) method
on an Api instance (such as [IChartApi](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi),
[ISeriesApi](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi),
[IPriceScaleApi](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPriceScaleApi), and
[ITimeScaleApi](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi)).

We can define properties for use as the components API as follows:

```html
<script setup>
    import { defineProps } from 'vue';

    const props = defineProps({
        type: {
            type: String,
            default: 'line',
        },
        data: {
            type: Array,
            required: true,
        },
        chartOptions: {
            type: Object,
        },
        seriesOptions: {
            type: Object,
        },
    });
</script>
```

These properties can be used during the creation of Api instances, for example:

```js
chart = createChart(chartContainer.value, props.chartOptions);
```

We can instruct Vue to
[`watch`](https://vuejs.org/api/reactivity-core.html#watch) these properties for
changes and allow us to provide code to react to these changes. Using this
mechanism, we can provide a direct mapping between the options properties and
the `applyOptions` methods on the instance. This allows the consumer of the
component to apply changes to the current options at any point during the
lifecycle of the chart.

:::info

Please note: the current options aren't reset when applying the new options, and
the new options can be a partial object. Thus it is possible to change one
option at a time while still keeping the current options.

:::

```js
watch(
    () => props.chartOptions,
    newOptions => {
        if (!chart) {
            return;
        }
        chart.applyOptions(newOptions);
    }
);

watch(
    () => props.priceScaleOptions,
    newOptions => {
        if (!chart) {
            return;
        }
        chart.priceScale('right').applyOptions(newOptions);
    }
);
```

### Exposing the chart instance or additional methods

There may be cases where you want to provide access to the chart instance, or
provide useful methods, to the consumer of the component. This can be achieved
with the
[`defineExpose`](https://vuejs.org/api/sfc-script-setup.html#defineexpose) hook
provided by Vue.

```js
import { defineExpose } from 'vue';

// A simple method to call `fitContent` on the time scale
const fitContent = () => {
    if (!chart) {
        return;
    }
    chart.timeScale().fitContent();
};

// Expose the chart instance via a method
const getChart = () => chart;

defineExpose({ fitContent, getChart });
```

The consumer of the component can create a reference to a specific instance of
the component and use the reference's value to evoke one of the exposed methods.

```html
<script setup>
    import { ref } from 'vue';
    import LWChart from './components/LWChart.vue';

    // ...

    const myChart = ref();

    const fitContent = () => {
        // call a method on the component.
        myChart.value.fitContent();
    };
</script>
<template>
    <LWChart type="line" :data="myData" ref="myChart" />
    <button type="button" @click="fitContent">Fit Content</button>
</template>
```

## Complete Sample Code

Presented below is the complete component source code for the Vue components. We
have also provided a sample Vue App component which showcases how to make use of
these components within a typical Vue application.

You can view a complete Vue project using these components at this
[StackBlitz example](https://stackblitz.com/edit/vitejs-vite-r4bbai?file=src/App.vue).

### Composition API

The following code block contains the source code for the sample Vue component
using the Composition API.

[Download file](https://tradingview.github.io/lightweight-charts/d70eb33f49b6f7f42b147ddc19461e63.vue)

**Click here to reveal the code.**

```html
<script setup>
import {
	ref,
	onMounted,
	onUnmounted,
	watch,
	defineExpose,
	defineProps,
} from 'vue';
import {
	createChart,
	LineSeries,
	AreaSeries,
	BarSeries,
	CandlestickSeries,
	HistogramSeries,
	BaselineSeries,
} from 'lightweight-charts';

const props = defineProps({
	type: {
		type: String,
		default: 'line',
	},
	data: {
		type: Array,
		required: true,
	},
	autosize: {
		default: true,
		type: Boolean,
	},
	chartOptions: {
		type: Object,
	},
	seriesOptions: {
		type: Object,
	},
	timeScaleOptions: {
		type: Object,
	},
	priceScaleOptions: {
		type: Object,
	},
});

function getChartSeriesDefinition(type) {
	switch (type.toLowerCase()) {
		case 'line':
			return LineSeries;
		case 'area':
			return AreaSeries;
		case 'bar':
			return BarSeries;
		case 'candlestick':
			return CandlestickSeries;
		case 'histogram':
			return HistogramSeries;
		case 'baseline':
			return BaselineSeries;
	}
	return LineSeries;
}

// Lightweight Charts™ instances are stored as normal JS variables
// If you need to use a ref then it is recommended that you use `shallowRef` instead
let series;
let chart;

const chartContainer = ref();

const fitContent = () => {
	if (!chart) return;
	chart.timeScale().fitContent();
};

const getChart = () => {
	return chart;
};

defineExpose({ fitContent, getChart });

// Auto resizes the chart when the browser window is resized.
const resizeHandler = () => {
	if (!chart || !chartContainer.value) return;
	const dimensions = chartContainer.value.getBoundingClientRect();
	chart.resize(dimensions.width, dimensions.height);
};

// Creates the chart series and sets the data.
const addSeriesAndData = props => {
	const seriesDefinition = getChartSeriesDefinition(props.type);
	series = chart.addSeries(seriesDefinition, props.seriesOptions);
	series.setData(props.data);
};

onMounted(() => {
	// Create the Lightweight Charts Instance using the container ref.
	chart = createChart(chartContainer.value, props.chartOptions);
	addSeriesAndData(props);

	if (props.priceScaleOptions) {
		chart.priceScale('right').applyOptions(props.priceScaleOptions);
	}

	if (props.timeScaleOptions) {
		chart.timeScale().applyOptions(props.timeScaleOptions);
	}

	chart.timeScale().fitContent();

	if (props.autosize) {
		window.addEventListener('resize', resizeHandler);
	}
});

onUnmounted(() => {
	if (chart) {
		chart.remove();
		chart = null;
	}
	if (series) {
		series = null;
	}
	window.removeEventListener('resize', resizeHandler);
});

/*
 * Watch for changes to any of the component properties.

 * If an options property is changed then we will apply those options
 * on top of any existing options previously set (since we are using the
 * `applyOptions` method).
 *
 * If there is a change to the chart type, then the existing series is removed
 * and the new series is created, and assigned the data.
 *
 */
watch(
	() => props.autosize,
	enabled => {
		if (!enabled) {
			window.removeEventListener('resize', resizeHandler);
			return;
		}
		window.addEventListener('resize', resizeHandler);
	}
);

watch(
	() => props.type,
	newType => {
		if (series && chart) {
			chart.removeSeries(series);
		}
		addSeriesAndData(props);
	}
);

watch(
	() => props.data,
	newData => {
		if (!series) return;
		series.setData(newData);
	}
);

watch(
	() => props.chartOptions,
	newOptions => {
		if (!chart) return;
		chart.applyOptions(newOptions);
	}
);

watch(
	() => props.seriesOptions,
	newOptions => {
		if (!series) return;
		series.applyOptions(newOptions);
	}
);

watch(
	() => props.priceScaleOptions,
	newOptions => {
		if (!chart) return;
		chart.priceScale('right').applyOptions(newOptions);
	}
);

watch(
	() => props.timeScaleOptions,
	newOptions => {
		if (!chart) return;
		chart.timeScale().applyOptions(newOptions);
	}
);
</script>

<template>
	<div class="lw-chart" ref="chartContainer"></div>
</template>

<style scoped>
.lw-chart {
	height: 100%;
}
</style>
```

### Options API

The following code block contains the source code for the sample Vue component
using the Options API.

[Download file](https://tradingview.github.io/lightweight-charts/ab60cb7ce1ce30aa5c3707791372ef66.vue)

**Click here to reveal the code.**

```html
<script>
import {
	createChart,
	LineSeries,
	AreaSeries,
	BarSeries,
	CandlestickSeries,
	HistogramSeries,
	BaselineSeries,
} from 'lightweight-charts';

// Lightweight Chart instances are stored as normal JS variables
// If you need to use a ref then it is recommended that you use `shallowRef` instead
let series;
let chart;

function getChartSeriesDefinition(type) {
	switch (type.toLowerCase()) {
		case 'line':
			return LineSeries;
		case 'area':
			return AreaSeries;
		case 'bar':
			return BarSeries;
		case 'candlestick':
			return CandlestickSeries;
		case 'histogram':
			return HistogramSeries;
		case 'baseline':
			return BaselineSeries;
	}
	return LineSeries;
}

// Creates the chart series and sets the data.
const addSeriesAndData = (type, seriesOptions, data) => {
	const seriesDefinition = getChartSeriesDefinition(type);
	series = chart.addSeries(seriesDefinition, seriesOptions);
	series.setData(data);
};

// Auto resizes the chart when the browser window is resized.
const resizeHandler = container => {
	if (!chart || !container) return;
	const dimensions = container.getBoundingClientRect();
	chart.resize(dimensions.width, dimensions.height);
};

export default {
	props: {
		type: {
			type: String,
			default: 'line',
		},
		data: {
			type: Array,
			required: true,
		},
		autosize: {
			default: true,
			type: Boolean,
		},
		chartOptions: {
			type: Object,
		},
		seriesOptions: {
			type: Object,
		},
		timeScaleOptions: {
			type: Object,
		},
		priceScaleOptions: {
			type: Object,
		},
	},
	mounted() {
		// Create the Lightweight Charts Instance using the container ref.
		chart = createChart(this.$refs.chartContainer, this.chartOptions);
		addSeriesAndData(this.type, this.seriesOptions, this.data);

		if (this.priceScaleOptions) {
			chart.priceScale('right').applyOptions(this.priceScaleOptions);
		}

		if (this.timeScaleOptions) {
			chart.timeScale().applyOptions(this.timeScaleOptions);
		}

		chart.timeScale().fitContent();

		if (this.autosize) {
			window.addEventListener('resize', () =>
				resizeHandler(this.$refs.chartContainer)
			);
		}
	},
	unmounted() {
		if (chart) {
			chart.remove();
			chart = null;
		}
		if (series) {
			series = null;
		}
		window.removeEventListener('resize', resizeHandler);
	},
	/*
	 * Watch for changes to any of the component properties.
	 *
	 * If an options property is changed then we will apply those options
	 * on top of any existing options previously set (since we are using the
	 * `applyOptions` method).
	 *
	 * If there is a change to the chart type, then the existing series is removed
	 * and the new series is created, and assigned the data.
	 *
	 */
	watch: {
		autosize(enabled) {
			if (!enabled) {
				window.removeEventListener('resize', () =>
					resizeHandler(this.$refs.chartContainer)
				);
				return;
			}
			window.addEventListener('resize', () =>
				resizeHandler(this.$refs.chartContainer)
			);
		},
		type(newType) {
			if (series && chart) {
				chart.removeSeries(series);
			}
			addSeriesAndData(this.type, this.seriesOptions, this.data);
		},
		data(newData) {
			if (!series) return;
			series.setData(newData);
		},
		chartOptions(newOptions) {
			if (!chart) return;
			chart.applyOptions(newOptions);
		},
		seriesOptions(newOptions) {
			if (!series) return;
			series.applyOptions(newOptions);
		},
		priceScaleOptions(newOptions) {
			if (!chart) return;
			chart.priceScale('right').applyOptions(newOptions);
		},
		timeScaleOptions(newOptions) {
			if (!chart) return;
			chart.timeScale().applyOptions(newOptions);
		},
	},
	methods: {
		fitContent() {
			if (!chart) return;
			chart.timeScale().fitContent();
		},
		getChart() {
			return chart;
		},
	},
	expose: ['fitContent', 'getChart'],
};
</script>

<template>
	<div class="lw-chart" ref="chartContainer"></div>
</template>

<style scoped>
.lw-chart {
	height: 100%;
}
</style>
```

### Example Vue App Component

The following code block contains the source code for a sample Vue Application
component which makes use of the Vue components shown above. It showcases a few
ways to control and interact with the component.

[Download file](https://tradingview.github.io/lightweight-charts/0cc41be55e7e9304d21e481e63cb165e.vue)

**Click here to reveal the code.**

```html
<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import { ref } from 'vue';

/*
 * There are example components in both API styles: Options API, and Composition API
 *
 * Select your preferred style from the imports below:
 */
// import LWChart from './components/composition-api/LWChart.vue';
import LWChart from './components/options-api/LWChart.vue';

/**
 * Generates sample data for the Lightweight Charts™ example
 * @param  {Boolean} ohlc Whether generated dat should include open, high, low, and close values
 * @returns {Array} sample data
 */
function generateSampleData(ohlc) {
	const randomFactor = 25 + Math.random() * 25;
	function samplePoint(i) {
		return (
			i *
				(0.5 +
					Math.sin(i / 10) * 0.2 +
					Math.sin(i / 20) * 0.4 +
					Math.sin(i / randomFactor) * 0.8 +
					Math.sin(i / 500) * 0.5) +
			200
		);
	}

	const res = [];
	let date = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	const numberOfPoints = ohlc ? 100 : 500;
	for (var i = 0; i < numberOfPoints; ++i) {
		const time = date.getTime() / 1000;
		const value = samplePoint(i);
		if (ohlc) {
			const randomRanges = [
				-1 * Math.random(),
				Math.random(),
				Math.random(),
			].map(i => i * 10);
			const sign = Math.sin(Math.random() - 0.5);
			res.push({
				time,
				low: value + randomRanges[0],
				high: value + randomRanges[1],
				open: value + sign * randomRanges[2],
				close: samplePoint(i + 1),
			});
		} else {
			res.push({
				time,
				value,
			});
		}

		date.setUTCDate(date.getUTCDate() + 1);
	}

	return res;
}

const chartOptions = ref({});
const data = ref(generateSampleData(false));
const seriesOptions = ref({
	color: 'rgb(45, 77, 205)',
});
const chartType = ref('line');
const lwChart = ref();

function randomShade() {
	return Math.round(Math.random() * 255);
}

const randomColor = (alpha = 1) => {
	return `rgba(${randomShade()}, ${randomShade()}, ${randomShade()}, ${alpha})`;
};

const colorsTypeMap = {
	area: [
		['topColor', 0.4],
		['bottomColor', 0],
		['lineColor', 1],
	],
	bar: [
		['upColor', 1],
		['downColor', 1],
	],
	baseline: [
		['topFillColor1', 0.28],
		['topFillColor2', 0.05],
		['topLineColor', 1],
		['bottomFillColor1', 0.28],
		['bottomFillColor2', 0.05],
		['bottomLineColor', 1],
	],
	candlestick: [
		['upColor', 1],
		['downColor', 1],
		['borderUpColor', 1],
		['borderDownColor', 1],
		['wickUpColor', 1],
		['wickDownColor', 1],
	],
	histogram: [['color', 1]],
	line: [['color', 1]],
};

// Set a random colour for the series as an example of how
// to apply new options to series. A similar appraoch will work on the
// option properties.
const changeColors = () => {
	const options = {};
	const colorsToSet = colorsTypeMap[chartType.value];
	colorsToSet.forEach(c => {
		options[c[0]] = randomColor(c[1]);
	});
	seriesOptions.value = options;
};

const changeData = () => {
	const candlestickTypeData = ['candlestick', 'bar'].includes(chartType.value);
	const newData = generateSampleData(candlestickTypeData);
	data.value = newData;
	if (chartType.value === 'baseline') {
		const average =
			newData.reduce((s, c) => {
				return s + c.value;
			}, 0) / newData.length;
		seriesOptions.value = { baseValue: { type: 'price', price: average } };
	}
};

const changeType = () => {
	const types = [
		'line',
		'area',
		'baseline',
		'histogram',
		'candlestick',
		'bar',
	].filter(t => t !== chartType.value);
	const randIndex = Math.round(Math.random() * (types.length - 1));
	chartType.value = types[randIndex];
	changeData();

	// call a method on the component.
	lwChart.value.fitContent();
};
</script>

<template>
	<div class="chart-container">
		<LWChart
			:type="chartType"
			:data="data"
			:autosize="true"
			:chart-options="chartOptions"
			:series-options="seriesOptions"
			ref="lwChart"
		/>
	</div>
	<button type="button" @click="changeColors">Set Random Colors</button>
	<button type="button" @click="changeType">Change Chart Type</button>
	<button type="button" @click="changeData">Change Data</button>
</template>
<style scoped>
.chart-container {
	height: calc(100% - 3.2em);
}
</style>
```

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
