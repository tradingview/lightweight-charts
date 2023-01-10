// if using esm version (installed via npm):
import { createChart } from 'lightweight-charts';

// If using standalone version (loaded via a script tag):
// const { createChart } = LightweightCharts;

(function() {
	// Styles for the custom element
	const elementStyles = `
                    :host {
                        display: block;
                    }
                    :host[hidden] {
                        display: none;
                    }
                    .chart-container {
                        height: 100%;
                        width: 100%;
                    }
                `;

	// Class definition for the custom element
	class LightweightChartWC extends HTMLElement {
		// Attributes to observe. When changes occur, `attributeChangedCallback` is called.
		static get observedAttributes() {
			return ['type', 'autosize'];
		}

		// Helper function to get the series constructor name from a chart type
		// eg. 'line' -> 'addLineSeries'
		static getChartSeriesConstructorName(type) {
			return `add${type.charAt(0).toUpperCase() + type.slice(1)}Series`;
		}

		constructor() {
			super();
			this.chart = undefined;
			this.series = undefined;
			this.__data = [];
			this._resizeEventHandler = () => this._resizeHandler();
		}

		/**
		 * `connectedCallback()` fires when the element is inserted into the DOM.
		 */
		connectedCallback() {
			this.attachShadow({ mode: 'open' });

			/**
			 * Attributes you may want to set, but should only change if
			 * not already specified.
			 */
			// if (!this.hasAttribute('tabindex'))
			// this.setAttribute('tabindex', -1);

			// A user may set a property on an _instance_ of an element,
			// before its prototype has been connected to this class.
			// The `_upgradeProperty()` method will check for any instance properties
			// and run them through the proper class setters.
			this._upgradeProperty('type');
			this._upgradeProperty('autosize');

			// We load the data attribute before creating the chart
			// so the `setTypeAndData` method can have an initial value.
			this._tryLoadInitialProperty('data');

			// Create the div container for the chart
			const container = document.createElement('div');
			container.setAttribute('class', 'chart-container');
			// create the stylesheet for the custom element
			const style = document.createElement('style');
			style.textContent = elementStyles;
			this.shadowRoot.append(style, container);

			// Create the Lightweight Chart
			this.chart = createChart(container);
			this.setTypeAndData();

			// Read initial values using attributes and then clear the attributes
			// since we don't want to 'reflect' data properties onto the elements
			// attributes.
			const richDataProperties = [
				'options',
				'series-options',
				'pricescale-options',
				'timescale-options',
			];
			richDataProperties.forEach(propertyName => {
				this._tryLoadInitialProperty(propertyName);
			});

			if (this.autosize) {
				window.addEventListener('resize', this._resizeEventHandler);
			}
		}

		/**
		 * Any data properties which are provided as JSON string values
		 * when the component is attached to the DOM will be used as the
		 * initial values for those properties.
		 *
		 * Note: once the component is attached, then any changes to these
		 * attributes will be ignored (not observed), and should rather be
		 * set using the property directly.
		 */
		_tryLoadInitialProperty(name) {
			if (this.hasAttribute(name)) {
				const valueString = this.getAttribute(name);
				let value;
				try {
					value = JSON.parse(valueString);
				} catch (error) {
					console.error(
						`Unable to read attribute ${name}'s value during initialisation.`
					);
					return;
				}
				// change kebab case attribute name to camel case.
				const propertyName = name
					.split('-')
					.map((text, index) => {
						if (index < 1) {return text;}
						return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
					})
					.join('');
				this[propertyName] = value;
				this.removeAttribute(name);
			}
		}

		// Create a chart series (according to the 'type' attribute) and set it's data.
		setTypeAndData() {
			if (this.series && this.chart) {
				this.chart.removeSeries(this.series);
			}
			this.series =
				this.chart[
					LightweightChartWC.getChartSeriesConstructorName(this.type)
				]();
			this.series.setData(this.data);
		}

		_upgradeProperty(prop) {
			if (this.hasOwnProperty(prop)) {
				const value = this[prop];
				delete this[prop];
				this[prop] = value;
			}
		}

		/**
		 * `disconnectedCallback()` fires when the element is removed from the DOM.
		 * It's a good place to do clean up work like releasing references and
		 * removing event listeners.
		 */
		disconnectedCallback() {
			if (this.chart) {
				this.chart.remove();
				this.chart = null;
			}
			window.removeEventListener('resize', this._resizeEventHandler);
		}

		/**
		 * Reflected Properties
		 *
		 * These Properties and their corresponding attributes should mirror one another.
		 */
		set type(value) {
			this.setAttribute('type', value || 'line');
		}

		get type() {
			return this.getAttribute('type') || 'line';
		}

		set autosize(value) {
			const autosize = Boolean(value);
			if (autosize) {this.setAttribute('autosize', '');} else {this.removeAttribute('autosize');}
		}

		get autosize() {
			return this.hasAttribute('autosize');
		}

		/**
		 * Rich Data Properties
		 *
		 * These Properties are not reflected to a corresponding attribute.
		 */
		set data(value) {
			let newData = value;
			if (typeof newData !== 'object' || !Array.isArray(newData)) {
				newData = [];
				console.warn('Lightweight Charts: Data should be an array');
			}
			this.__data = newData;
			if (this.series) {
				this.series.setData(this.__data);
			}
		}

		get data() {
			return this.__data;
		}

		set options(value) {
			if (!this.chart) {return;}
			this.chart.applyOptions(value);
		}

		get options() {
			if (!this.chart) {return null;}
			return this.chart.options();
		}

		set seriesOptions(value) {
			if (!this.series) {return;}
			this.series.applyOptions(value);
		}

		get seriesOptions() {
			if (!this.series) {return null;}
			return this.series.options();
		}

		set priceScaleOptions(value) {
			if (!this.chart) {return;}
			this.chart.priceScale().applyOptions(value);
		}

		get priceScaleOptions() {
			if (!this.series) {return null;}
			return this.chart.priceScale().options();
		}

		set timeScaleOptions(value) {
			if (!this.chart) {return;}
			this.chart.timeScale().applyOptions(value);
		}

		get timeScaleOptions() {
			if (!this.series) {return null;}
			return this.chart.timeScale().options();
		}

		/**
		 * `attributeChangedCallback()` is called when any of the attributes in the
		 * `observedAttributes` array are changed.
		 */
		attributeChangedCallback(name, _oldValue, newValue) {
			if (!this.chart) {return;}
			const hasValue = newValue !== null;
			switch (name) {
				case 'type':
					this.data = [];
					this.setTypeAndData();
					break;
				case 'autosize':
					if (hasValue) {
						window.addEventListener('resize', () => this._resizeEventHandler);
						// call once when added to an existing element
						this._resizeEventHandler();
					} else {
						window.removeEventListener('resize', this._resizeEventHandler);
					}
					break;
			}
		}

		_resizeHandler() {
			const container = this.shadowRoot.querySelector('div.chart-container');
			if (!this.chart || !container) {return;}
			const dimensions = container.getBoundingClientRect();
			this.chart.resize(dimensions.width, dimensions.height);
		}
	}

	window.customElements.define('lightweight-chart', LightweightChartWC);
})();
