import React, { useState } from "react";
import {ChartComponent, chartDataType} from "./ReactComponents"
import {timeValueData, ohlcData} from "../data/chart-data.js"
import { SeriesType } from "lightweight-charts";

export const MenuComponent = () => {
	const [chartType, setChartType] = useState<SeriesType>();
	const [dataUsed, setDataUsed] = useState<chartDataType[]>();

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
			'display': 'flex',
			'flexDirection': 'column',
			'alignItems': 'flex-start',
		}}>
			<label htmlFor="chartType-select">Pick any chart type from the following to check how it's done</label>
			<select id="chartType-select" onChange={handleChange} style={{
				'padding': '2px 5px',
				'margin': '20px'
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
}