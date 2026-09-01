# Advanced React example

This example demonstrates how to integrate Lightweight Charts™ with React. Unlike the [basic example](https://tradingview.github.io/lightweight-charts/tutorials/react/simple.md), which uses a single component, this one shows how to split the library API across multiple components.

:::tip

This guide assumes that you are familiar with Lightweight Charts™. You should know how to set up a project and create a chart.
We also recommend that you consider the [basic React example](https://tradingview.github.io/lightweight-charts/tutorials/react/simple.md) first.

:::

## Component-based architecture

In Lightweight Charts™, a chart is a container that stores one or more [series](https://tradingview.github.io/lightweight-charts/docs/series-types.md).
Each series has its own options, such as [`AreaStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/AreaStyleOptions) and [`LineStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LineStyleOptions).

In your React application, you can create a _Chart_ component that has _Series_ child components. Each _Series_ could also have its own children, and so on.
The pseudocode below shows a potential application structure:

```
<Chart component>
    <Series component 1>
        <Child component />
    </Series component 1>

    {/* ... */}

    <Series component N>
        <Child component />
    </Series component N>
</Chart component>
```

The components should interact with each other, for example, when more data is loaded to the series or the chart is resized.
To implement this interaction, use [hooks](https://react.dev/reference/react/hooks) and [composition](https://reactjs.org/docs/composition-vs-inheritance.html).

One drawback of hooks, such as [`useEffect`](https://react.dev/reference/react/hooks#effect-hooks), in a parent–child setup is that hooks run in a bottom-up order during instantiation, but in a top-down order during cleanup.
The following skeleton illustrates the mechanism.

```js
import React, { useEffect } from 'react';

export const ParentComponent = () => {
    // This effect will be triggered in position 3
    useEffect(() =>
        () => {
            // This cleanup will be triggered in position 1
        }
    , []);

    // This effect will be triggered in position 4
    useEffect(() =>
        () => {
            // This cleanup will be triggered in position 2
        }
    , []);

    // All props and internal references will be passed down to the children
    return (
        <ChildComponent />
    );
};
ParentComponent.displayName = 'ParentComponent';

export const ChildComponent = () => {
    // This effect will be triggered in position 1
    useEffect(() =>
        () => {
            // This cleanup will be triggered in position 3
        }
    , []);

    // This effect will be triggered in position 2
    useEffect(() =>
        () => {
            // This cleanup will be triggered in position 4
        }
    , []);

    return (
        <div />
    );
};
ChildComponent.displayName = 'ChildComponent';
```

In the example above, the `ChildComponent` (_Series_) may be created before the `ParentComponent` (_Chart_), which can lead to unexpected behavior.
To prevent this, you should use hooks with [refs](https://react.dev/learn/manipulating-the-dom-with-refs) that allow a parent to share internal references or properties directly with its children.

Considering using refs, the component structure and usage remain the same, but under the hood it works as follows:

```
<Chart component>
    <ChartContainer>
        <Series component 1>
            <Child component />
        </Series component 1>

        {/* ... */}

        <Series component N>
            <Child component />
        </Series component N>
    <ChartContainer>
</Chart component>
```

In this structure, `ChartContainer` is required to provide a DOM element where the chart will be rendered. `ChartContainer` also creates a reference that stores functions to manage the chart's lifecycle. This reference is then passed down to each _Series_.

The _Series_ component uses the same approach to manage the lifecycle of a series: creating, adding data, and cleaning it up.

Both of these components can expose functions from their internal reference objects at a higher level.
Therefore, any other component can interact with the chart or any series directly.

The application skeleton is shown below:

```js
import React, { useEffect, useImperativeHandle, useRef, createContext, forwardRef } from 'react';

const Context = createContext();

export const MainComponent = props =>
    // Creates the first reference and instantiates a ParentComponent
    (
        <div ref={chartReference}>
            <ParentComponent {...props} container={container} />
        </div>
    );

export const ParentComponent = forwardRef((props, ref) => {
    const internalRef = useRef({
        method1() {
            // This function would be responsible for creating the chart for instance
        },
        methodn() {
            // This function would be responsible for cleaning up the chart
        },
    });

    // This effect will be triggered in position 3
    useEffect(() =>
        () => {
            // This cleanup will be triggered in position 1
        }
    , []);

    // This effect will be triggered in position 4
    useEffect(() =>
        () => {
            // This cleanup will be triggered in position 2
        }
    , []);

    useImperativeHandle(ref, () => {
        // That's the hook responsible for exposing part of/entirety of internalRef
    }, []);

    // Following bit is to propagate all props & internalRef object down to children
    return (
        <Context.Provider value={internalRef.current}>
            {props.children}
        </Context.Provider>
    );
});
ParentComponent.displayName = 'ParentComponent';

export const ChildComponent = forwardRef((props, ref) => {
    const internalRef = useRef({
        method1() {
            // This function would be responsible for creating a series
        },
        methodn() {
            // This function would be responsible for removing it
        },
    });

    // This effect will be triggered in position 1
    useEffect(() =>
        () => {
            // This cleanup will be triggered in position 3
        }
    , []);

    // This effect will be triggered in position 2
    useEffect(() =>
        () => {
            // This cleanup will be triggered in position 4
        }
    , []);

    useImperativeHandle(ref, () => {
        // That's the hook responsible for exposing part of/entirety of internalRef
    }, []);

    // Following bit is to propagate all props & internalRef object down to children
    return (
        <Context.Provider value={internalRef.current}>
            {props.children}
        </Context.Provider>
    );
});
ChildComponent.displayName = 'ChildComponent';
```

## Complete code

:::info

In this example, chart colors are specified with props depending on the current theme (light or dark). In a real application, consider using [Context](https://react.dev/learn/passing-data-deeply-with-context) instead.

:::

```jsx
import { createChart, LineSeries, AreaSeries } from 'lightweight-charts';
import React, {
	createContext,
	forwardRef,
	useCallback,
	useContext,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';

const Context = createContext();

const initialData = [
	{ time: '2018-10-11', value: 52.89 },
	{ time: '2018-10-12', value: 51.65 },
	{ time: '2018-10-13', value: 51.56 },
	{ time: '2018-10-14', value: 50.19 },
	{ time: '2018-10-15', value: 51.86 },
	{ time: '2018-10-16', value: 51.25 },
];

const initialData2 = [
	{ time: '2018-10-11', value: 42.89 },
	{ time: '2018-10-12', value: 41.65 },
	{ time: '2018-10-13', value: 41.56 },
	{ time: '2018-10-14', value: 40.19 },
	{ time: '2018-10-15', value: 41.86 },
	{ time: '2018-10-16', value: 41.25 },
];
const currentDate = new Date(initialData[initialData.length - 1].time);

export const App = props => {
	const {
		colors: {
			backgroundColor = 'white',
			lineColor = '#2962FF',
			textColor = 'black',
		} = {},
	} = props;

	const [chartLayoutOptions, setChartLayoutOptions] = useState({});
	// The following variables illustrate how a series could be updated.
	const series1 = useRef(null);
	const series2 = useRef(null);
	const [started, setStarted] = useState(false);
	const [isSecondSeriesActive, setIsSecondSeriesActive] = useState(false);

	// The purpose of this effect is purely to show how a series could
	// be updated using the `reference` passed to the `Series` component.
	useEffect(() => {
		if (series1.current === null) {
			return;
		}
		let intervalId;

		if (started) {
			intervalId = setInterval(() => {
				currentDate.setDate(currentDate.getDate() + 1);
				const next = {
					time: currentDate.toISOString().slice(0, 10),
					value: 53 - 2 * Math.random(),
				};
				series1.current.update(next);
				if (series2.current) {
					series2.current.update({
						...next,
						value: 43 - 2 * Math.random(),
					});
				}
			}, 1000);
		}
		return () => clearInterval(intervalId);
	}, [started]);

	useEffect(() => {
		setChartLayoutOptions({
			background: {
				color: backgroundColor,
			},
			textColor,
		});
	}, [backgroundColor, textColor]);

	return (
		<>
			<button type="button" onClick={() => setStarted(current => !current)}>
				{started ? 'Stop updating' : 'Start updating series'}
			</button>
			<button type="button" onClick={() => setIsSecondSeriesActive(current => !current)}>
				{isSecondSeriesActive ? 'Remove second series' : 'Add second series'}
			</button>
			<Chart layout={chartLayoutOptions}>
				<Series
					ref={series1}
					type={'line'}
					data={initialData}
					color={lineColor}
				/>
				{isSecondSeriesActive && <Series
					ref={series2}
					type={'area'}
					data={initialData2}
					color={lineColor}
				/>}
			</Chart>
		</>
	);
};

export function Chart(props) {
	const [container, setContainer] = useState(false);
	const handleRef = useCallback(ref => setContainer(ref), []);
	return (
		<div ref={handleRef}>
			{container && <ChartContainer {...props} container={container} />}
		</div>
	);
}

export const ChartContainer = forwardRef((props, ref) => {
	const { children, container, layout, ...rest } = props;

	const chartApiRef = useRef({
		isRemoved: false,
		api() {
			if (!this._api) {
				this._api = createChart(container, {
					...rest,
					layout,
					width: container.clientWidth,
					height: 300,
				});
				this._api.timeScale().fitContent();
			}
			return this._api;
		},
		free(series) {
			if (this._api && series) {
				this._api.removeSeries(series);
			}
		},
	});

	useLayoutEffect(() => {
		const currentRef = chartApiRef.current;
		const chart = currentRef.api();

		const handleResize = () => {
			chart.applyOptions({
				...rest,
				width: container.clientWidth,
			});
		};

		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
			chartApiRef.current.isRemoved = true;
			chart.remove();
		};
	}, []);

	useLayoutEffect(() => {
		const currentRef = chartApiRef.current;
		currentRef.api();
	}, []);

	useLayoutEffect(() => {
		const currentRef = chartApiRef.current;
		currentRef.api().applyOptions(rest);
	}, []);

	useImperativeHandle(ref, () => chartApiRef.current.api(), []);

	useEffect(() => {
		const currentRef = chartApiRef.current;
		currentRef.api().applyOptions({ layout });
	}, [layout]);

	return (
		<Context.Provider value={chartApiRef.current}>
			{props.children}
		</Context.Provider>
	);
});
ChartContainer.displayName = 'ChartContainer';

export const Series = forwardRef((props, ref) => {
	const parent = useContext(Context);
	const context = useRef({
		api() {
			if (!this._api) {
				const { children, data, type, ...rest } = props;
				this._api =
					type === 'line'
						? parent.api().addSeries(LineSeries, rest)
						: parent.api().addSeries(AreaSeries, rest);
				this._api.setData(data);
			}
			return this._api;
		},
		free() {
			// check if parent component was removed already
			if (this._api && !parent.isRemoved) {
				// remove only current series
				parent.free(this._api);
			}
		},
	});

	useLayoutEffect(() => {
		const currentRef = context.current;
		currentRef.api();

		return () => currentRef.free();
	}, []);

	useLayoutEffect(() => {
		const currentRef = context.current;
		const { children, data, ...rest } = props;
		currentRef.api().applyOptions(rest);
	});

	useImperativeHandle(ref, () => context.current.api(), []);

	return (
		<Context.Provider value={context.current}>
			{props.children}
		</Context.Provider>
	);
});
Series.displayName = 'Series';
```

## Result

## What's next?

Consider other community examples on how to wrap Lightweight Charts™ into React components:

- [lightweight-charts-react-wrapper](https://github.com/trash-and-fire/lightweight-charts-react-wrapper)
- [lightweight-charts-react-components](https://github.com/ukorvl/lightweight-charts-react-components)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
