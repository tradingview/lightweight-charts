import { createChart } from 'lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';

export const ChartComponent = () => {
	const chart = useRef();
	const chartContainerRef = useRef();

	const [series, setSeries] = useState();

	const handleResize = () => {
		chart.current.resize(400, 300);
	};

	useEffect(
		() => {
			if (chart.current !== undefined && chartContainerRef.current !== undefined && series !== undefined) {
				series.setData(data);
			}
		},
		[data, series]
	);

	useEffect(
		() => {
			chart.current = createChart(chartContainerRef.current, {
				width: 400,
				height: 300,
			});

			const newSeries = chart.current.addAreaSeries();
			newSeries.setData(data);
			setSeries(newSeries);

			window.addEventListener('resize', handleResize);
			return () => {
				window.removeEventListener('resize', handleResize);

				chart.current.remove();
				chart.current = undefined;
			};
		},
		[data]
	);

	return (
		<div
			ref={chartContainerRef}
		/>
	);
};

const data = [
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

export function App() {
	return (
		<ChartComponent data={data}></ChartComponent>
	);
}
