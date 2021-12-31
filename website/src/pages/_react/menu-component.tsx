import { SeriesType } from 'lightweight-charts';
import React, { useState } from 'react';

import { ChartComponent, ChartDataType } from './react-components';

const timeValueData = [
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

const ohlcData = [
	{
		time: '2018-12-22',
		open: 162.81,
		high: 167.96,
		low: 160.17,
		close: 160.48,
	},
	{
		time: '2018-12-24',
		open: 160.16,
		high: 161.4,
		low: 158.09,
		close: 158.14,
	},
	{
		time: '2018-12-26',
		open: 159.46,
		high: 168.28,
		low: 159.44,
		close: 168.28,
	},
	{
		time: '2018-12-27',
		open: 166.44,
		high: 170.46,
		low: 163.36,
		close: 170.32,
	},
	{
		time: '2018-12-28',
		open: 171.22,
		high: 173.12,
		low: 168.6,
		close: 170.22,
	},
	{
		time: '2018-12-31',
		open: 171.47,
		high: 173.24,
		low: 170.65,
		close: 171.82,
	},
];

export const MenuComponent = (): JSX.Element => {
	const [chartType, setChartType] = useState<SeriesType>();
	const [dataUsed, setDataUsed] = useState<ChartDataType[]>();

	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		e.persist();

		const {
			currentTarget: { value },
		} = e;

		switch (value) {
			case 'Area':
				setChartType('Area');
				setDataUsed(timeValueData);
				break;
			case 'Bar':
				setChartType('Bar');
				setDataUsed(ohlcData);
				break;
			case 'Baseline':
				setChartType('Baseline');
				setDataUsed(timeValueData);
				break;
			case 'Candlestick':
				setChartType('Candlestick');
				setDataUsed(ohlcData);
				break;
			case 'Histogram':
				setChartType('Histogram');
				setDataUsed(timeValueData);
				break;
			case 'Line':
				setChartType('Line');
				setDataUsed(timeValueData);
				break;
			default:
				break;
		}
	};

	return (
		<div style={{
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'flex-start',
		}}>
			<label htmlFor="chartType-select">Pick any chart type from the following to check how it's done</label>
			<select id="chartType-select" onChange={handleChange} style={{
				padding: '2px 5px',
				margin: '20px',
			}}>
				<option value={''} defaultChecked> Select a desired type of chart</option>
				<option value={'Area'}> Area</option>
				<option value={'Bar'}> Bar</option>
				<option value={'Baseline'}> Baseline</option>
				<option value={'Candlestick'}> Candlestick</option>
				<option value={'Histogram'}> Histogram</option>
				<option value={'Line'}> Line</option>
			</select>

			{chartType && dataUsed && (
				<ChartComponent typeOfChart={chartType} data={dataUsed} />
			)}
		</div>
	);
};
