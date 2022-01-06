import { createChart, IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';

export interface NonOHLCDataType {
	time: string;
	value: number;
}

export interface OHLCDataType {
	time: string;
	open: number;
	high: number;
	low: number;
	close: number;
}

export type ChartDataType = NonOHLCDataType | OHLCDataType;

export const CodeComponent = (options: { typeOfChart: SeriesType; seriesType: string | null }): JSX.Element => {
	const { seriesType, typeOfChart } = options;

	const code = `
		// Here's a piece of code that could be placed in a separate file like 'ChartComponent.tsx'
		export const ChartComponent = (options: { data }) => {
			const chart = createChart(containerId, {
				width: 400,
				height: 300,
				rightPriceScale: {
					visible: true
				},
			});

			const series = chart.${seriesType}();
			series.setData(data);
		}

		// When used as a component, you could 'import' your component into another one
		import { ChartComponent } from './ChartComponent';

		...
		export const MyNewComponent = () => {
			// Careful as for some type data would have to be OHLC formatted as in
			// { time: '2018-12-22', open: 162.81, high: 167.96, low: 160.17, close: 160.48 }
			const myData = [
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

			return (
				<ChartComponent typeOfChart={'${typeOfChart}'} data={myData} />
			);
		};
	`;

	return (
		<>
			<label>
				This is the piece of code used to render that chart
				<textarea readOnly cols={110} rows={40} value={code}/>
			</label>
		</>
	);
};

export interface ChartProperties {
	typeOfChart: SeriesType;
	data: ChartDataType[];
}

export const ChartComponent = (props: ChartProperties): JSX.Element => {
	const { typeOfChart, data } = props;
	const chartContainerRef = useRef() as React.MutableRefObject<HTMLInputElement>;

	const [seriesType, setSeriesType] = useState<string|null>(typeOfChart);
	const [chart, setChart] = useState<IChartApi>();

	useEffect(
		() => {
			chartContainerRef.current.innerHTML = '';
			setSeriesType(null);
		},
		[typeOfChart]
	);

	useEffect(
		() => {
			const handleResize = () => {
				chart?.resize(chartContainerRef.current.clientWidth, chartContainerRef.current.clientHeight);
			};

			window.addEventListener('resize', handleResize);

			return () => window.removeEventListener('resize', handleResize);
		},
		[chart]
	);

	useEffect(
		() => {
			// tslint:disable-next-line: strict-type-predicates
			if (chartContainerRef.current !== undefined && seriesType === null) {
				const mainChart = createChart(chartContainerRef.current, {
					width: 600,
					height: 300,
					rightPriceScale: {
						visible: true,
					},
				});

				setChart(mainChart);

				let series: ISeriesApi<'Area'> | ISeriesApi<'Bar'> | ISeriesApi<'Baseline'> | ISeriesApi<'Candlestick'> | ISeriesApi<'Histogram'> | ISeriesApi<'Line'> | undefined;
				switch (typeOfChart) {
					case 'Area':
						series = mainChart.addAreaSeries();
						setSeriesType('addAreaSeries');
						break;

					case 'Bar':
						series = mainChart.addBarSeries();
						setSeriesType('addBarSeries');
						break;

					case 'Baseline':
						series = mainChart.addBaselineSeries({ baseValue: { price: 57.5 } });
						setSeriesType('addBaselineSeries');
						break;

					case 'Candlestick':
						series = mainChart.addCandlestickSeries();
						setSeriesType('addCandlestickSeries');
						break;

					case 'Histogram':
						series = mainChart.addHistogramSeries({ priceFormat: { type: 'volume' } });
						setSeriesType('addHistogramSeries');
						break;

					case 'Line':
						series = mainChart.addLineSeries();
						setSeriesType('addLineSeries');
						break;

					default: break;
				}

				if (series !== undefined) {
					mainChart.timeScale().fitContent();
					series.setData(data);
				}
			}
		},
		[seriesType, data, typeOfChart]
	);

	return (
		<div
			ref={chartContainerRef}
		/>
	);
};
