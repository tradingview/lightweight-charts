import useThemeContext from '@theme/hooks/useThemeContext';
import Layout from '@theme/Layout';
import { createChart, DeepPartial, IChartApi, LayoutOptions, LineData } from 'lightweight-charts';
import React from 'react';

import data from './data.json';
import styles from './index.module.css';

interface ThemeAwareImgProps {
	src: string;
	srcDark: string;
	width?: number;
	height?: number;
}

function ThemeAwareImg(props: ThemeAwareImgProps): JSX.Element {
	const { isDarkTheme } = useThemeContext();
	const src = isDarkTheme ? props.srcDark : props.src;

	return <img width={props.width} height={props.height} src={src} />;
}

function getChartLayoutOptionsForTheme(isDarkTheme: boolean): DeepPartial<LayoutOptions> {
	return isDarkTheme
		? { background: { color: '#000000' }, textColor: 'rgba(248, 249, 253, 1)' }
		: { background: { color: 'rgba(248, 249, 253, 1)' }, textColor: '#000000' };
}

function HeroChart(): JSX.Element {
	const ref = React.useRef<HTMLDivElement>(null);

	const { isDarkTheme } = useThemeContext();

	const [chart, setChart] = React.useState<IChartApi>();

	React.useLayoutEffect(
		() => {
			const container = ref.current;

			if (!container) {
				return;
			}

			const c = createChart(container, {
				layout: getChartLayoutOptionsForTheme(isDarkTheme),
				grid: {
					horzLines: {
						visible: false,
					},
					vertLines: {
						visible: false,
					},
				},
				timeScale: {
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

			c.timeScale().setVisibleLogicalRange({ from: 1, to: data.orangeData.length - 2 });

			const resizeListener = () => {
				const { width, height } = container.getBoundingClientRect();
				c.resize(width, height);
				c.timeScale().fitContent();
			};

			setChart(c);

			window.addEventListener('resize', resizeListener);

			return () => {
				window.removeEventListener('resize', resizeListener);
				c.remove();
				setChart(undefined);
			};
		},
		[]
	);

	React.useLayoutEffect(
		() => {
			if (!chart) {
				return;
			}

			chart.applyOptions({ layout: getChartLayoutOptionsForTheme(isDarkTheme) });
		},
		[isDarkTheme]
	);

	return (
		<div className={styles.HeroChartContainer} ref={ref}></div>
	);
}

function Index(): JSX.Element {
	return (
		<Layout title="Lightweight Charts">
			<div className={styles.RootContainer}>
				<div className={styles.HeroContainer}>
					<HeroChart />
					<div className={styles.HeroTextContainer}>
						<ThemeAwareImg src="img/logo.svg" srcDark="img/logo-dark.svg" />
						<h1>Lightweight Charts</h1>
						<p>Free, open-source and feature-rich. At just 40 kilobytes, the dream of lightweight interactive charts is now a reality.</p>
						<div className={styles.HeroButtonsContainer}>
							<a className={[styles.HeroButton, styles.HeroButtonPrimary].join(' ')} href="docs">Get Started</a>
							<a className={styles.HeroButton} href="docs/api">API Reference</a>
						</div>
					</div>
				</div>
				<div className={styles.LargeTextContainer}>
					<h1>Fully customizable & free charts that don&apos;t contain hidden ads</h1>
					<p>Millions of websites still use static pictures for showing financial charts. The old way is not interactive and doesn&apos;t scale with various devices. Pictures always had a huge advantage of their small size and fast loading — but no more!</p>
				</div>
				<div className={styles.LargeCardContainer}>
					<div className={styles.LargeCard}>
						<ThemeAwareImg width={120} height={120} src="img/performance.svg" srcDark="img/performance-dark.svg" />
						<h2>High Performance</h2>
						<p>Our charting solutions were engineered from the start to work with huge data arrays. Charts stay responsive and nimble even with thousands of bars even with updates multiple times per second with new ticks.</p>
					</div>
					<div className={styles.LargeCard}>
						<ThemeAwareImg width={120} height={120} src="img/responsive.svg" srcDark="img/responsive-dark.svg" />
						<h2>Interactive, responsive and mobile-friendly</h2>
						<p>Intelligently adapts to any device. Charts are carefully engineered for best interactivity, both for powerful desktops with a mouse, and touch-optimized for tablets and phones.</p>
					</div>
					<div className={styles.LargeCard}>
						<ThemeAwareImg width={120} height={120} src="img/heart.svg" srcDark="img/heart-dark.svg" />
						<h2>Finance is at the heart</h2>
						<p>Charting is our core. TradingView charts are used by tens of thousands of websites, apps and financial portals, as well as millions of traders around the world. You can be sure that we&apos;ve included everything you need, starting from popular chart types to advanced price scaling.</p>
					</div>
				</div>
				<div className={styles.SmallCardContainer}>
					<div className={styles.SmallCard}>
						<img width={44} height={44} src="img/paperplane.svg" />
						<h3>Ultra lightweight - just 40 Kb</h3>
						<p>HTML5 Canvas technology no larger than a standard GIF file.</p>
					</div>
					<div className={styles.SmallCard}>
						<img width={44} height={44} src="img/cog.svg" />
						<h3>Integrating & connecting any data is quick and easy</h3>
						<p>Built for developers, by developers. Charts are rich in features and easy to integrate — so you can integrate with a breeze.</p>
					</div>
					<div className={styles.SmallCard}>
						<img width={44} height={44} src="img/sliders.svg" />
						<h3>Open-source </h3>
						<p>Fully customizable & free charts that don&apos;t contain hidden ads. Contributions are welcome!</p>
					</div>
					<div className={styles.SmallCard}>
						<img width={44} height={44} src="img/shapes.svg" />
						<h3>Flexible styling</h3>
						<p>Change the standard look & feel to match your style with perfection. There are many premade examples that you can copy & paste.</p>
					</div>
				</div>
			</div>
		</Layout>
	);
}

// eslint-disable-next-line import/no-default-export
export default Index;
