import { useColorMode } from '@docusaurus/theme-common';
import {
	createChart,
	type DeepPartial,
	type IChartApi,
	type ISeriesApi,
	type LayoutOptions,
	type LineData,
	type Range,
	type Time,
} from 'lightweight-charts';
import React from 'react';

import CodeBlock, { CodeBlockProps } from '../Codeblock';
import data from './hero-chart-data.json';
import styles from './index.module.css';

const realtimeUpdatePeriod = 1000; // 1 seconds
const realtimeUpdatesCount = 90;

function buildChartData(): LineData[] {
	const endDate = Date.now().valueOf();
	const day = 27 * 60 * 60 * 1000;
	const startDate = endDate - day * data.values.length;
	return data.values.map((v: number, i: number) => {
		return {
			time: ((startDate + i * day) / 1000) as Time,
			value: v,
		};
	});
}

const allChartData = buildChartData();
const chartData = allChartData.slice(0, -realtimeUpdatesCount);
const realtimeData = allChartData.slice(-realtimeUpdatesCount);

function getVisibleLogicalRange(dataLength: number, addedPoints: number): Range<number> {
	return { from: addedPoints + 0.5, to: dataLength + addedPoints };
}

function getLayoutOptionsForTheme(
	isDarkTheme: boolean
): DeepPartial<LayoutOptions> {
	return isDarkTheme
		? { background: { color: '#131722' }, textColor: 'rgba(248, 249, 253, 1)' }
		: { background: { color: 'rgba(248, 249, 253, 1)' }, textColor: '#000000' };
}

function useThemeAwareLayoutOptions(): DeepPartial<LayoutOptions> {
	const { colorMode } = useColorMode();
	const isDarkTheme = colorMode === 'dark';

	const [layoutOptions, setLayoutOptions] = React.useState<
		DeepPartial<LayoutOptions>
	>(getLayoutOptionsForTheme(isDarkTheme));

	React.useEffect(
		() => {
			setLayoutOptions(getLayoutOptionsForTheme(isDarkTheme));
		},
		[isDarkTheme]
	);

	return layoutOptions;
}

function Chart(): JSX.Element {
	const ref = React.useRef<HTMLDivElement>(null);
	const layout = useThemeAwareLayoutOptions();
	const [chart, setChart] = React.useState<IChartApi | null>(null);
	const [areaSeries, setAreaSeries] = React.useState<ISeriesApi<'Area'> | null>(null);
	const [updateCount, setUpdateCount] = React.useState<number>(0);

	React.useEffect(
		() => {
			const container = ref.current;

			if (!container) {
				return;
			}

			const c = createChart(container, {
				layout,
				rightPriceScale: {
					borderVisible: false,
					autoScale: false,
				},
				grid: {
					horzLines: {
						visible: false,
					},
					vertLines: {
						visible: false,
					},
				},
				timeScale: {
					borderVisible: false,
					fixLeftEdge: true,
					fixRightEdge: true,
				},
				handleScroll: false,
				handleScale: false,
			});

			const aS = c.addAreaSeries({
				lineColor: '#2962ff',
				topColor: '#2962ff',
				bottomColor: 'rgba(41, 98, 255, 0.28)',
			});

			aS.setData(chartData);

			const visibleLogicalRange = getVisibleLogicalRange(chartData.length, 0);
			c.timeScale().setVisibleLogicalRange(visibleLogicalRange);

			setChart(c);
			setAreaSeries(aS);

			container.setAttribute('reveal', 'true');

			return () => {
				c.remove();
				setChart(null);
			};
		},
		[]
	);

	React.useEffect(
		() => {
			if (!chart || !ref.current) {
				return;
			}

			const container = ref.current;

			const resizeListener = () => {
				const { width, height } = container.getBoundingClientRect();
				chart.resize(width, height);

				// TODO: remove this after releasing the new version (fixed in v4.0.0)
				// and use lockVisibleTimeRangeOnResize time scale option instead
				const visibleLogicalRange = getVisibleLogicalRange(chartData.length, updateCount);
				chart.timeScale().setVisibleLogicalRange(visibleLogicalRange);
			};

			window.addEventListener('resize', resizeListener);

			window.requestAnimationFrame(resizeListener);

			return () => {
				window.removeEventListener('resize', resizeListener);
			};
		},
		[chart]
	);

	React.useEffect(
		() => {
			if (!chart) {
				return;
			}

			chart.applyOptions({ layout });
		},
		[layout, chart]
	);

	React.useEffect(
		() => {
			if (!areaSeries || !chart) {
				return;
			}
			if (updateCount >= 0) {
				areaSeries.update(realtimeData[updateCount]);
				chart.timeScale().setVisibleLogicalRange(getVisibleLogicalRange(chartData.length, updateCount));
			}
			if (updateCount < realtimeData.length - 1) {
				setTimeout(
					() => {
						setUpdateCount(updateCount + 1);
					},
					realtimeUpdatePeriod
				);
			}
		},
		[areaSeries, updateCount, chart]
	);

	return <div className={styles.ChartContainer} ref={ref}></div>;
}

export default function HeroChart(props: {
	codeBlocks: CodeBlockProps[];
}): JSX.Element {
	return (
		<section className={styles.HeroChartSection}>
			<div className={styles.HeroChartGradient}></div>
			<div className={styles.HeroChartGlass}></div>
			<figure className={styles.HeroChartFigure}>
				<Chart />
			</figure>
			{props.codeBlocks.map((codeBlock: CodeBlockProps) => (
				<CodeBlock key={codeBlock.name} {...codeBlock} />
			))}
			<div className={styles.HeroChartFadeBottom}></div>
			<div className={styles.HeroChartFadeBottomDeep}></div>
		</section>
	);
}
