/*
 * This is the Web Component version of the App Vue component
 *
 * This WC is used as the on-page example for the Vue tutorial, and includes
 * some specific logic for reacting to the current docusaurus theme and adjusting the
 * chart colours as required.
 */
import { defineCustomElement } from 'vue/dist/vue.esm-bundler';
import { createChart, ColorType } from 'lightweight-charts';
import { themeColors } from '../../../theme-colors';

let series;
let chart;

function getChartSeriesConstructorName(type) {
	return `add${type.charAt(0).toUpperCase() + type.slice(1)}Series`;
}

const addSeriesAndData = (type, seriesOptions, data) => {
	const seriesConstructor = getChartSeriesConstructorName(type);
	series = chart[seriesConstructor](seriesOptions);
	series.setData(data);
};

const resizeHandler = container => {
	if (!chart || !container) {
		return;
	}
	const dimensions = container.getBoundingClientRect();
	chart.resize(dimensions.width, dimensions.height);
};

const LWChart = {
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
	template: `<div class="lw-chart" ref="lightweightChart"></div>`,
	mounted() {
		chart = createChart(this.$refs.lightweightChart, this.chartOptions);
		addSeriesAndData(this.type, this.seriesOptions, this.data);

		if (this.priceScaleOptions) {
			chart.priceScale().applyOptions(this.priceScaleOptions);
		}

		if (this.timeScaleOptions) {
			chart.timeScale().applyOptions(this.timeScaleOptions);
		}

		chart.timeScale().fitContent();

		if (this.autosize) {
			window.addEventListener('resize', () =>
				resizeHandler(this.$refs.lightweightChart)
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
	},
	watch: {
		autosize(enabled) {
			if (!enabled) {
				window.removeEventListener('resize', () =>
					resizeHandler(this.$refs.lightweightChart)
				);
				return;
			}
			window.addEventListener('resize', () =>
				resizeHandler(this.$refs.lightweightChart)
			);
		},
		type() {
			if (series && chart) {
				chart.removeSeries(series);
			}
			addSeriesAndData(this.type, this.seriesOptions, this.data);
		},
		data(newData) {
			if (!series) {
				return;
			}
			series.setData(newData);
		},
		chartOptions(newOptions) {
			if (!chart) {
				return;
			}
			chart.applyOptions(newOptions);
		},
		seriesOptions(newOptions) {
			if (!series) {
				return;
			}
			series.applyOptions(newOptions);
		},
		priceScaleOptions(newOptions) {
			if (!chart) {
				return;
			}
			chart.priceScale().applyOptions(newOptions);
		},
		timeScaleOptions(newOptions) {
			if (!chart) {
				return;
			}
			chart.timeScale().applyOptions(newOptions);
		},
	},
	methods: {
		fitContent() {
			if (!chart) {
				return;
			}
			chart.timeScale().fitContent();
		},
		getChart: () => chart,
	},
	expose: ['fitContent', 'getChart'],
};

function generateSampleData(ohlc) {
	const randomFactor = 25 + Math.random() * 25;
	const samplePoint = i =>
		i *
			(0.5 +
				Math.sin(i / 10) * 0.2 +
				Math.sin(i / 20) * 0.4 +
				Math.sin(i / randomFactor) * 0.8 +
				Math.sin(i / 500) * 0.5) +
		200;

	const res = [];
	const date = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	const numberOfPoints = ohlc ? 100 : 500;
	for (let i = 0; i < numberOfPoints; ++i) {
		const time = date.getTime() / 1000;
		const value = samplePoint(i);
		if (ohlc) {
			const randomRanges = [
				-1 * Math.random(),
				Math.random(),
				Math.random(),
			].map(j => j * 10);
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

function randomShade() {
	return Math.round(Math.random() * 255);
}

function randomColor(alpha = 1) {
	return `rgba(${randomShade()}, ${randomShade()}, ${randomShade()}, ${alpha})`;
}

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

const checkPageTheme = () =>
	document.documentElement.getAttribute('data-theme') === 'dark';

const VueExample = defineCustomElement({
	components: {
		LWChart,
	},
	data: () => ({
		chartOptions: {
			layout: {
				background: {
					color: 'transparent',
					type: ColorType.Solid,
				},
			},
		},
		dataset: generateSampleData(false),
		seriesOptions: {},
		chartType: 'area',
	}),
	template: `
        <div class="chart-container">
          <LWChart
            :type="chartType"
            :data="dataset"
            :autosize="true"
            :chart-options="chartOptions"
            :series-options="seriesOptions"
            ref="lwChart"
          />  
        </div>
        <button type="button" @click="changeColors">Set Random Colors</button>
        <button type="button" @click="changeType">Change Chart Type</button>
        <button type="button" @click="changeData">Change Data</button>  
        `,
	styles: [
		`
      button {
        border-radius: 8px;
        border: 1px solid transparent;
        padding: 0.5em 1em;
        font-size: 1em;
        font-weight: 500;
        font-family: inherit;
        background-color: var(--hero-button-background-color-active, #e9e9e9);
        color: var(--hero-button-text-color, #e9e9e9);
        cursor: pointer;
        transition: border-color 0.25s;
        margin-left: 0.5em;
      }
      button:hover {
        border-color: #3179F5;
        background-color: var(--hero-button-background-color-hover);
        color: var(--hero-button-text-color-hover-active);
      }
      button:focus,
      button:focus-visible {
        outline: 4px auto -webkit-focus-ring-color;
      }
        
      .chart-container {
        height: var(--lwchart-height, 300px);
      }
    
      .lw-chart {
        height: 100%;
      }
    `,
	],
	mounted() {
		this.changeChartTheme(checkPageTheme());

		if (window.MutationObserver) {
			const callback = _ => {
				this.changeChartTheme(checkPageTheme());
			};
			this.observer = new window.MutationObserver(callback);
			this.observer.observe(document.documentElement, { attributes: true });
		}
	},
	unmounted() {
		if (this.observer) {
			this.observer.disconnect();
		}
	},
	methods: {
		changeColors() {
			const options = {};
			const colorsToSet = colorsTypeMap[this.chartType];
			colorsToSet.forEach(c => {
				options[c[0]] = randomColor(c[1]);
			});
			this.seriesOptions = options;
		},
		changeData() {
			const candlestickTypeData = ['candlestick', 'bar'].includes(
				this.chartType
			);
			const newData = generateSampleData(candlestickTypeData);
			this.dataset = newData;
			if (this.chartType === 'baseline') {
				const average =
					newData.reduce((s, c) => s + c.value, 0) / newData.length;
				this.seriesOptions = {
					baseValue: { type: 'price', price: average },
				};
			}
		},
		changeType() {
			const types = [
				'line',
				'area',
				'baseline',
				'histogram',
				'candlestick',
				'bar',
			].filter(t => t !== this.chartType);
			const randIndex = Math.round(Math.random() * (types.length - 1));
			this.chartType = types[randIndex];
			this.changeData();

			// call a method on the component.
			this.$refs.lwChart.fitContent();
		},
		changeChartTheme(isDark) {
			const theme = isDark ? themeColors.DARK : themeColors.LIGHT;
			const gridColor = isDark ? '#424F53' : '#D6DCDE';
			this.chartOptions = {
				layout: {
					textColor: theme.CHART_TEXT_COLOR,
					background: {
						color: theme.CHART_BACKGROUND_COLOR,
					},
				},
				grid: {
					vertLines: {
						color: gridColor,
					},
					horzLines: {
						color: gridColor,
					},
				},
			};
		},
	},
});

window.customElements.define('vue-example', VueExample);
