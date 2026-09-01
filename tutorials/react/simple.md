# Basic React example

This example demonstrates how to embed Lightweight Charts™ in a React component. Use it as a starting point and adapt it to your needs by adding properties or additional functionality.

## Prepare your project

Clone the [Parcel starter kit](https://github.com/brandiqa/react-parcel-starter) and install dependencies to set up a project. You can use any other tool or starter kit that fits your requirements.

```console
git clone git@github.com:brandiqa/react-parcel-starter.git lwc-react
cd lwc-react
npm install
```

## Create a charting component

The code below defines a React component that renders a chart with an [area series](https://tradingview.github.io/lightweight-charts/docs/series-types.md#area). You can change the [series type](https://tradingview.github.io/lightweight-charts/docs/series-types.md) to any other, such as candlestick or line.

:::info

In this example, chart colors are specified with props depending on the current theme (light or dark). In a real application, consider using [Context](https://react.dev/learn/passing-data-deeply-with-context) instead.

:::

```jsx
import { AreaSeries, createChart, ColorType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

export const ChartComponent = props => {
	const {
		data,
		colors: {
			backgroundColor = 'white',
			lineColor = '#2962FF',
			textColor = 'black',
			areaTopColor = '#2962FF',
			areaBottomColor = 'rgba(41, 98, 255, 0.28)',
		} = {},
	} = props;

	const chartContainerRef = useRef();

	useEffect(
		() => {
			const handleResize = () => {
				chart.applyOptions({ width: chartContainerRef.current.clientWidth });
			};

			const chart = createChart(chartContainerRef.current, {
				layout: {
					background: { type: ColorType.Solid, color: backgroundColor },
					textColor,
				},
				width: chartContainerRef.current.clientWidth,
				height: 300,
			});
			chart.timeScale().fitContent();

			const newSeries = chart.addSeries(AreaSeries, { lineColor, topColor: areaTopColor, bottomColor: areaBottomColor });
			newSeries.setData(data);

			window.addEventListener('resize', handleResize);

			return () => {
				window.removeEventListener('resize', handleResize);

				chart.remove();
			};
		},
		[data, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]
	);

	return (
		<div
			ref={chartContainerRef}
		/>
	);
};

const initialData = [
	{ time: '2018-12-22', value: 32.51 },
	{ time: '2018-12-23', value: 31.11 },
	{ time: '2018-12-24', value: 27.02 },
	{ time: '2018-12-25', value: 27.32 },
	{ time: '2018-12-26', value: 25.17 },
	{ time: '2018-12-27', value: 28.89 },
	{ time: '2018-12-28', value: 25.46 },
	{ time: '2018-12-29', value: 23.92 },
	{ time: '2018-12-30', value: 22.68 },
	{ time: '2018-12-31', value: 22.67 },
];

export function App(props) {
	return (
		<ChartComponent {...props} data={initialData}></ChartComponent>
	);
}
```

## Result

Execute the `npm start` command in the `lwc-react` folder to run the project locally. Then open `http://localhost:1234` in your web browser to see the result.

## What's next?

As a next step, consider the [advanced example](https://tradingview.github.io/lightweight-charts/tutorials/react/advanced.md), which shows how to embed Lightweight Charts™ into a component having child components.

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
