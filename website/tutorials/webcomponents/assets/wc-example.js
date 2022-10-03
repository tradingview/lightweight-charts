import './lw-chart.js';
import { themeColors } from '../../../theme-colors';

(function() {
	const template = document.createElement('template');
	template.innerHTML = `
    <style>
    :host {
        display: block;
    }
    :host[hidden] {
        display: none;
    }
    #example {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
    }
    #chart {
        flex-grow: 1;
    }
    #buttons {
        flex-direction: row;
    }
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
        
      #example-chart {
        height: var(--lwchart-height, 300px);
      }
    </style>
    <div id="example">
        <div id="example-container">
            <lightweight-chart id="example-chart"
                autosize
                type="line"
            ></lightweight-chart>
        </div>
        <div id="buttons">
            <button id="change-colours-button" type="button">Set Random Colors</button>
            <button id="change-type-button" type="button">Change Chart Type</button>
            <button id="change-data-button" type="button">Change Data</button>
        </div>
    </div>
  `;

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

	const randomShade = () => Math.round(Math.random() * 255);

	const randomColor = (alpha = 1) =>
		`rgba(${randomShade()}, ${randomShade()}, ${randomShade()}, ${alpha})`;

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

	class LightweightChartExampleWC extends HTMLElement {
		constructor() {
			super();
			this.chartElement = undefined;
		}

		connectedCallback() {
			this.attachShadow({ mode: 'open' });
			this.shadowRoot.appendChild(template.content.cloneNode(true));

			this.changeChartTheme(checkPageTheme());

			if (window.MutationObserver) {
				const callback = _ => {
					this.changeChartTheme(checkPageTheme());
				};
				this.observer = new window.MutationObserver(callback);
				this.observer.observe(document.documentElement, { attributes: true });
			}

			this.chartElement = this.shadowRoot.querySelector('#example-chart');
			this._changeData();

			this.addButtonClickHandlers();
			this.chartElement.chart.timeScale().fitContent();
		}

		addButtonClickHandlers() {
			this.changeColours = () => this._changeColours();
			this.changeType = () => this._changeType();
			this.changeData = () => this._changeData();
			this.shadowRoot
				.querySelector('#change-colours-button')
				.addEventListener('click', this.changeColours);
			this.shadowRoot
				.querySelector('#change-type-button')
				.addEventListener('click', this.changeType);
			this.shadowRoot
				.querySelector('#change-data-button')
				.addEventListener('click', this.changeData);
		}

		removeButtonClickHandlers() {
			if (this.changeColours) {
				this.shadowRoot
					.querySelector('#change-colours-button')
					.removeEventListener('click', this.changeColours);
			}
			if (this.changeType) {
				this.shadowRoot
					.querySelector('#change-type-button')
					.removeEventListener('click', this.changeType);
			}
			if (this.changeData) {
				this.shadowRoot
					.querySelector('#change-data-button')
					.removeEventListener('click', this.changeData);
			}
		}

		_changeColours() {
			if (!this.chartElement) {
				return;
			}
			const options = {};
			const colorsToSet = colorsTypeMap[this.chartElement.type];
			colorsToSet.forEach(c => {
				options[c[0]] = randomColor(c[1]);
			});
			this.chartElement.seriesOptions = options;
		}

		_changeData() {
			if (!this.chartElement) {
				return;
			}
			const candlestickTypeData = ['candlestick', 'bar'].includes(
				this.chartElement.type
			);
			const newData = generateSampleData(candlestickTypeData);
			this.chartElement.data = newData;
			if (this.chartElement.type === 'baseline') {
				const average =
					newData.reduce((s, c) => s + c.value, 0) / newData.length;
				this.chartElement.seriesOptions = {
					baseValue: { type: 'price', price: average },
				};
			}
		}

		_changeType() {
			if (!this.chartElement) {
				return;
			}
			const types = [
				'line',
				'area',
				'baseline',
				'histogram',
				'candlestick',
				'bar',
			].filter(t => t !== this.chartElement.type);
			const randIndex = Math.round(Math.random() * (types.length - 1));
			this.chartElement.type = types[randIndex];
			this._changeData();

			// call a method on the component.
			this.chartElement.chart.timeScale().fitContent();
		}

		disconnectedCallback() {}

		changeChartTheme(isDark) {
			if (!this.chartElement) {
				return;
			}
			const theme = isDark ? themeColors.DARK : themeColors.LIGHT;
			const gridColor = isDark ? '#424F53' : '#D6DCDE';
			this.chartElement.options = {
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
		}
	}

	window.customElements.define(
		'lightweight-chart-example',
		LightweightChartExampleWC
	);
})();
