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
