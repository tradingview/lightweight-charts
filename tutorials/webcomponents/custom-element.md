# Web Components - Custom Element

:::info

The following describes a relatively simple example that only allows for a
single [series](https://tradingview.github.io/lightweight-charts/docs/series-types.md) to be rendered. This example can be used as
a starting point, and could be tweaked further using our extensive
[API](https://tradingview.github.io/lightweight-charts/docs/api).

:::

This guide will focus on the key concepts required to get Lightweight Charts™
running within a Vanilla JS web component (using
[custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)).
Please note this guide is not intended as a complete step-by-step tutorial. The
example web component custom element can be found at the
[bottom](#complete-sample-code) of this guide.

If you are new to Web Components then please have a look at the following
resources before proceeding further with this example.

- [MDN: Using Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
- [Custom Elements Best Practices](https://web.dev/custom-elements-best-practices/)
- [Open Web Components](https://open-wc.org)

## About the example custom element

The example Web Components custom element has the following features.

The ability to:

- specify the series type via a component attribute,
- specify the series data via a component property,
- control the chart, series, time scale, and price scale options via properties,
- enable automatic resizing of the chart when the browser is resized.

The example may not fit your requirements completely. Creating a general-purpose
declarative wrapper for Lightweight Charts™ imperative API is a challenge, but
hopefully, you can adapt this example to your use case.

### Component showcase

Presented below is the finished wrapper custom element which is discussed
throughout this guide. The interactive buttons beneath the chart are showcasing
how to interact with the component and that code is provided below as well
(within the example app custom element).

## Creating the chart

Web Components are a suite of different technologies which allow you to
encapsulate functionality within custom elements.
[Custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
make use of the standard web languages `html`, `css`, and `js` which means that
there aren't many specific changes, or extra knowledge, required to get
Lightweight Charts™ working within a custom element.

The process of creating a chart is essentially the same as when using the
library normally, except that we are encapsulating all the `html`, `css`, and
`js` code specific to the chart within our custom element.

Starting with a simple boilerplate custom element, as shown below:

```js
(function() {
    class LightweightChartWC extends HTMLElement {
        connectedCallback() {
            this.attachShadow({ mode: 'open' });
        }

        disconnectedCallback() {}
    }

    // Register our custom element with a specific tag name.
    window.customElements.define('lightweight-chart', LightweightChartWC);
})();
```

The first step is to define the `html` for the custom element. For Lightweight
Charts, all we need to do is create a `div` element to act as our container
element. You can create the html by cloning a `template` (as seen in our usage
example below) or by imperatively using the DOM JS api as shown below:

```js
class LightweightChartWC extends HTMLElement {
    // ...
    // Within the class definition
    connectedCallback() {
        // Create the div container for the chart
        const container = document.createElement('div');
        container.setAttribute('class', 'chart-container');

        this.shadowRoot.append(container);
    }
}
```

Next we will want to define some basic styles to ensure that the container
element fills the available space and that the element can be hidden using the
`hidden` attribute.

```js
// Outside of the Class definition
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

// ...

class LightweightChartWC extends HTMLElement {
    // ...
    // Within the class definition
    connectedCallback() {
        // Create the div container for the chart
        const container = document.createElement('div');
        container.setAttribute('class', 'chart-container');
        // create the stylesheet for the custom element
        const style = document.createElement('style');
        style.textContent = elementStyles;
        this.shadowRoot.append(style, container);
    }
}
```

Finally, we can now create the chart using Lightweight Charts™. Depending on your
build process, you may either need to import Lightweight Charts™, or access it
from the global scope (if loaded as a standalone script). To create the chart,
we call the [`createChart`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createChart) constructor function, passing
our container element as the first argument. The returned variable will be a
[`IChartApi`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi) instance which we can use as shown
in the API documentation. The IChartApi instance provides all the required
functionality to create series, assign data, and more. See our
[Getting started](https://tradingview.github.io/lightweight-charts/docs.md) guide for a quick example.

```js
class LightweightChartWC extends HTMLElement {
    // ...
    connectedCallback() {
        // Create the div container for the chart
        const container = document.createElement('div');
        container.setAttribute('class', 'chart-container');

        // create the stylesheet for the custom element
        const style = document.createElement('style');
        style.textContent = elementStyles;
        this.shadowRoot.append(style, container);

        // Create the Lightweight Chart
        this.chart = createChart(container);
    }
}
```

## Attributes and properties

Whilst we could encapsulate everything required to create a chart within the
custom element, generally we wish to allow further customisation of the chart to
the consumers of the custom element. Attributes and properties are a great way
to provide this 'API' to the consumer.

As a general rule of thumb, it is better to use attributes for options which are
defined using simple values (number, string, boolean), and properties for rich
data types.

In our example, we will be using attributes for the series type option (type)
and the autosize flag which enables automatic resizing of the chart when the
window is resized. We will be using properties to provide the interfaces for
setting the series data, and options for the chart. Additionally, the IChartApi
instance will be accessable via the `chart` property such that the consumer has
full access to the entire API provided by Lightweight Charts™.

### Attributes

Attributes for the custom element can be set directly on the custom element
(within the html), or via javascript as seen for the properties in the next
section.

```html
<lightweight-chart autosize type="area"></lightweight-chart>
```

Attributes can be set and read from within the custom element's definition as
follows:

```js
// read `type` attribute
const type = this.getAttribute('type');

// set `type` attribute
this.setAttribute('type', 'line');
```

It is recommended that attributes be mirrored as properties on the custom
element (and reflected such that any changes appear on the html as well). This
can be achieved as follows:

```js
class LightweightChartWC extends HTMLElement {
    // ...
    // Within the class definition
    set type(value) {
        this.setAttribute('type', value || 'line');
    }

    get type() {
        return this.getAttribute('type') || 'line';
    }
}
```

We can observe any changes to an attribute by defining the static
`observedAttributes` getter on the custom element and the
`attributeChangedCallback` method on the class definition.

```js
class LightweightChartWC extends HTMLElement {
    // Attributes to observe. When changes occur, `attributeChangedCallback` is called.
    static get observedAttributes() {
        return ['type', 'autosize'];
    }

    /**
     * `attributeChangedCallback()` is called when any of the attributes in the
     * `observedAttributes` array are changed.
     */
    attributeChangedCallback(name, _oldValue, newValue) {
        if (!this.chart) {
            return;
        }
        const hasValue = newValue !== null;
        switch (name) {
        case 'type':
            // handle the changed attribute
            break;
        case 'autosize':
            // handle the changed attribute
            break;
        }
    }
}
```

### Properties

Properties for the custom element are read and set through javascript on a
reference to a custom element's instance. This instance can be created using
standard DOM methods such as `querySelector`.

```js
// Get a reference to an instance of the custom element on the page
const myChartElement = document.querySelector('lightweight-chart');

// read the data property
const currentData = myChartElement.data;

// set the seriesOptions property
myChartElement.seriesOptions = {
    color: 'blue',
};
```

We can define setters and getters for the properties if we need more control
over the property instead of it being just a value.

```js
class LightweightChartWC extends HTMLElement {
    // ...
    // Within the class definition
    set options(value) {
        if (!this.chart) {
            return;
        }
        this.chart.applyOptions(value);
    }

    get options() {
        if (!this.chart) {
            return null;
        }
        return this.chart.options();
    }
}
```

As mentioned earlier, it is recommended that any API which accepts complex (or
rich data) beyond a simple string, number, or boolean value should be property.
However, since properties can only be set via javascript there may be cases
where it would be preferable to define these values within the html markup. We
can provide an attribute interface for these properties which can be used to
define the initial values, then remove those attributes from the markup and
ignore any further changes to those attributes.

```js
class LightweightChartWC extends HTMLElement {
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
                    if (index < 1) {
                        return text;
                    }
                    return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
                })
                .join('');
            this[propertyName] = value;
            this.removeAttribute(name);
        }
    }

    connectedCallback() {
        // ...

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
    }
}
```

These attributes can be used to define the initial values for the properties as
follows (using JSON notation):

```html
<lightweight-chart
    data='[{"time": "2022-09-14", "value": 123.45},{"time": "2022-09-15", "value": 123.45}]'
    series-options='{"color":"blue"}'
></lightweight-chart>
```

## Accessing the chart instance or additional methods

The IChartApi instance will be accessible via the `chart` property on the custom
element. This can be used by the consumer of the custom element to fully control
the chart within the element.

```js
// Get a reference to an instance of the custom element on the page
const myChartElement = document.querySelector('lightweight-chart');

const chartApi = myChartElement.chart;

// For example, call the `fitContent` method on the time scale
chartApi.timeScale().fitContent();
```

## Using a Custom Element

Custom elements can be used just like any other normal html element after the
custom element has been defined and registered. The example custom element will
define and register itself (using
`window.customElements.define('lightweight-chart', LightweightChartWC);`) when
the script is loaded and executed, so all you need to do is include the script
tag on the page.

Depending on your build step for your page, you may either need to import
Lightweight Charts™ via an import statement, or access the library via the global
variable defined when using the standalone script version.

```js
// if using esm version (installed via npm):
// import { createChart } from 'lightweight-charts';

// If using standalone version (loaded via a script tag):
const { createChart } = LightweightCharts;
```

Similarily, the custom element can either be loaded via an 'side-effect' import
statement:

```js
// side-effect import statement (use within a module js file)
import './lw-chart.js';
```

 or via a script tag:

 ```html
<script src="lw-chart.js" defer></script>
```

Once the custom element script has been loaded and executed then you can use the
custom element anywhere that you can use normal html, including within other
frameworks like React, Vue, and Angular. See
[Custom Elements Everywhere](https://custom-elements-everywhere.com) for more
information.

### Standalone script example html file

If you are loading the Lightweight Charts™ library via the standalone script
version then you can also load the custom element via a script tag (see above
section for more info) and construct your html page as follows:

```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <meta
            name="viewport"
            content="width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0"
        />
        <title>Web component Example</title>
        <script
            type="text/javascript"
            src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.development.js"
        ></script>
        <style>
            #my-chart {
                height: 100vh;
                width: 100vw;
            }
        </style>
    </head>

    <body style="padding: 0; margin: 0">
        <lightweight-chart
            id="my-chart"
            autosize
            type="line"
            series-options='{"color": "red"}'
            data='[{ "time": "2018-10-19", "value": 52.89 },{ "time": "2018-10-22", "value": 51.65 }]'
        ></lightweight-chart>

        <script src="lw-chart.js" defer></script>
    </body>
</html>
```

## Complete Sample Code

Presented below is the complete custom element source code for the Web
component. We have also provided a sample custom element component which
showcases how to make use of these components within a typical html page.

### Wrapper Custom Element

The following code block contains the source code for the wrapper custom
element.

[Download file](https://github.com/tradingview/lightweight-charts/blob/master/website/tutorials/webcomponents/assets/lw-chart.js)

**Click here to reveal the code.**

```js
// if using esm version (installed via npm):
import { createChart, LineSeries, AreaSeries, CandlestickSeries, BaselineSeries, HistogramSeries, BarSeries } from 'lightweight-charts';

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

		static getChartSeriesDefinition(type) {
			switch (type) {
				case 'line':
					return LineSeries;
				case 'area':
					return AreaSeries;
				case 'candlestick':
					return CandlestickSeries;
				case 'baseline':
					return BaselineSeries;
				case 'bar':
					return BarSeries;
				case 'histogram':
					return HistogramSeries;
			}
			throw new Error(`${type} is an unsupported series type`);
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
				this.chart.addSeries(LightweightChartWC.getChartSeriesDefinition(this.type));
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
			this.chart.priceScale('right').applyOptions(value);
		}

		get priceScaleOptions() {
			if (!this.series) {return null;}
			return this.chart.priceScale('right').options();
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
```

### Example Usage Custom Element

The following code block contains the source code for the custom element
showcasing how to use the above custom element.

[Download file](https://github.com/tradingview/lightweight-charts/blob/master/website/tutorials/webcomponents/assets/wc-example.js)

**Click here to reveal the code.**

```js
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
```

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
