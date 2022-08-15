import { useColorMode } from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { createChart, DeepPartial, IChartApi, LayoutOptions, LineData } from 'lightweight-charts';
import React from 'react';

import Cog from '../img/cog.svg';
import HeroLogo from '../img/hero-logo.svg';
import InputSliders from '../img/input-sliders.svg';
import Paperplane from '../img/paperplane.svg';
import Screens from '../img/screens.svg';
import Shapes from '../img/shapes.svg';
import Speedometer from '../img/speedometer.svg';
import TradingviewHeart from '../img/tradingview-heart.svg';
import chartStyle from './chart.module.css';
import data from './hero-chart-data.json';
import styles from './index.module.css';

const visibleLogicalRange = { from: 0.5, to: data.orangeData.length - 1.5 };

function getLayoutOptionsForTheme(isDarkTheme: boolean): DeepPartial<LayoutOptions> {
	return isDarkTheme
		? { background: { color: '#131722' }, textColor: 'rgba(248, 249, 253, 1)' }
		: { background: { color: 'rgba(248, 249, 253, 1)' }, textColor: '#000000' };
}

function useThemeAwareLayoutOptions(): DeepPartial<LayoutOptions> {
	const { colorMode } = useColorMode();
	const isDarkTheme = colorMode === 'dark';

	const [layoutOptions, setLayoutOptions] = React.useState<DeepPartial<LayoutOptions>>(getLayoutOptionsForTheme(isDarkTheme));

	React.useEffect(
		() => {
			setLayoutOptions(getLayoutOptionsForTheme(isDarkTheme));
		},
		[isDarkTheme]
	);

	return layoutOptions;
}

function isScreenMinimumWidthForDisplayingChart(): boolean {
	return window.matchMedia('screen and (min-width: 1279.5px)').matches;
}

function HeroChart(): JSX.Element {
	const ref = React.useRef<HTMLDivElement>(null);
	const layout = useThemeAwareLayoutOptions();
	const [chartContainerClassName, setChartContainerClassName] = React.useState<string>(styles.HeroChartContainer);
	const [chart, setChart] = React.useState<IChartApi | null>(null);

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

			const orangeSeries = c.addAreaSeries({
				lineColor: '#FFE902',
				topColor: 'rgba(251, 140, 0, 0.6)',
				bottomColor: 'rgba(251, 140, 0, 0.2)',
			});
			const blueSeries = c.addAreaSeries({
				lineColor: 'rgba(15, 28, 249, 1)',
				topColor: 'rgba(15, 28, 249, 1)',
				bottomColor: 'rgba(15, 28, 249, 0.2)',
			});

			orangeSeries.setData(data.orangeData as LineData[]);
			blueSeries.setData(data.blueData as LineData[]);

			c.timeScale().setVisibleLogicalRange(visibleLogicalRange);

			if (isScreenMinimumWidthForDisplayingChart()) {
				setChartContainerClassName(`${styles.HeroChartContainer} ${styles.HeroChartAnimation}`);
			}

			setChart(c);

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
				if (!isScreenMinimumWidthForDisplayingChart()) {
					setChartContainerClassName(styles.HeroChartContainer);
					return;
				}

				const { width, height } = container.getBoundingClientRect();
				chart.resize(width, height);

				// TODO: remove this after releasing the new version (fixed in v4.0.0)
				// and use lockVisibleTimeRangeOnResize time scale option instead
				chart.timeScale().setVisibleLogicalRange(visibleLogicalRange);
			};

			window.addEventListener('resize', resizeListener);

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

	return (
		<div className={[chartContainerClassName, chartStyle.ChartContainer].join(' ')} ref={ref}></div>
	);
}

function Index(): JSX.Element {
	const { siteConfig } = useDocusaurusContext();

	return <div className={styles.RootContainer}>
		<div className={styles.HeroContainer}>
			<HeroChart />
			<div className={styles.HeroTextContainer}>
				<HeroLogo />
				<p>Free, open-source and feature-rich interactive charts</p>
				<div className={styles.HeroButtonsContainer}>
					<a className={[styles.HeroButton, styles.HeroButtonPrimary].join(' ')} href="docs">Get Started</a>
					<a className={styles.HeroButton} href="docs/api">API Reference</a>
				</div>
			</div>
		</div>
		<div className={styles.BelowChartContainer}>
			<div className={styles.LargeTextContainer}>
				<h1>Less is more</h1>
				<div>Millions of websites still use static pictures for showing financial charts. The old way is not interactive and doesn&apos;t scale with various devices. Pictures always had a huge advantage of their small size and fast loading&nbsp;—&nbsp;but no more!</div>
			</div>
			<div className={styles.LargeCardContainer}>
				<div className={[styles.LargeCard, styles.LargeCard1].join(' ')}>
					<Speedometer />
					<div className={styles.LargeCardInnerSpacer1} />
					<h2>High-performance</h2>
					<div className={styles.LargeCardInnerSpacer2} />
					<p>Our charting solutions were engineered from the start to work with huge data arrays. Charts stay responsive and nimble even with thousands of bars even with updates multiple times per second with new ticks.</p>
				</div>
				<div className={[styles.LargeCard, styles.LargeCard2].join(' ')}>
					<Screens />
					<h2>Interactive, responsive and mobile-friendly</h2>
					<div className={styles.LargeCardInnerSpacer2} />
					<p>Intelligently adapts to any device. Charts are carefully engineered for best interactivity, both for powerful desktops with a mouse, and touch-optimized for tablets and phones.</p>
				</div>
				<div className={[styles.LargeCard, styles.LargeCard3].join(' ')}>
					<TradingviewHeart />
					<div className={styles.LargeCardInnerSpacer1} />
					<h2>Finance is at the heart</h2>
					<div className={styles.LargeCardInnerSpacer2} />
					<p>Charting is our core. TradingView charts are used by tens of thousands of websites, apps and financial portals, as well as millions of traders around the world. You can be sure that we&apos;ve included everything you need, starting from popular chart types to advanced price scaling.</p>
				</div>
			</div>
			<div className={styles.SmallCardContainer}>
				<div className={[styles.SmallCard, styles.SmallCard1].join(' ')}>
					<Cog />
					<h3>Integrating & connecting any data is quick and easy</h3>
					<p>Built for developers, by developers. Charts are rich in features and easy to integrate — so you can integrate with a breeze.</p>
				</div>
				<div className={[styles.SmallCard, styles.SmallCard2].join(' ')}>
					<Paperplane />
					<h3>{`Ultra lightweight - just ${siteConfig.customFields?.bundleSize} Kb`}</h3>
					<p>HTML5 Canvas technology no larger than a standard GIF file.</p>
				</div>
				<div className={[styles.SmallCard, styles.SmallCard3].join(' ')}>
					<InputSliders />
					<h3>Open-source </h3>
					<p>Maintained by TradingView. Hosted on GitHub. Licensed under the Apache License, Version 2.0. Contributions welcome!</p>
				</div>
				<div className={[styles.SmallCard, styles.SmallCard4].join(' ')}>
					<Shapes />
					<h3>Flexible styling</h3>
					<p>Change the standard look & feel to match your style with perfection. There are many premade examples that you can copy & paste.</p>
				</div>
			</div>
		</div>
	</div>;
}

function LayoutWrapper(): JSX.Element {
	return (
		<Layout title="Lightweight Charts">
			<Index />
		</Layout>
	);
}

export default LayoutWrapper;
