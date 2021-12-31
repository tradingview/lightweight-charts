import { createChart } from 'lightweight-charts';
import React, { useRef } from 'react';

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

export const SetupComponent = (): JSX.Element => {
	const chartContainerRef = useRef() as React.MutableRefObject<HTMLInputElement>;

	// tslint:disable-next-line: strict-type-predicates
	if (chartContainerRef.current !== undefined) {
		const chart = createChart(chartContainerRef.current, {
			width: 400,
			height: 300,
		});

		const areaSeries = chart.addAreaSeries();
		areaSeries.setData(data);
	}

	return (
		<div
			ref={chartContainerRef}
		/>
	);
};
