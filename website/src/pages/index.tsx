import useThemeContext from '@theme/hooks/useThemeContext';
import Layout from '@theme/Layout';
import { createChart, IChartApi, UTCTimestamp } from 'lightweight-charts';
import React from 'react';

import Logo from '../../static/img/logo.svg';
import _styles from './index.module.css';

const styles = _styles as { [style: string]: string };

const data = { orangeData: [{ value: 33, time: 1628005368 as UTCTimestamp }, { value: 33.49774076716826, time: 1628610168 as UTCTimestamp }, { value: 33.00544183567645, time: 1629214968 as UTCTimestamp }, { value: 33.7026637942526, time: 1629819768 as UTCTimestamp }, { value: 33.21936886405405, time: 1630424568 as UTCTimestamp }, { value: 33.900609590144896, time: 1631029368 as UTCTimestamp }, { value: 33.17765657755362, time: 1631634168 as UTCTimestamp }, { value: 33.42924174402081, time: 1632238968 as UTCTimestamp }, { value: 33.11836183231501, time: 1632843768 as UTCTimestamp }, { value: 33.370546260351574, time: 1633448568 as UTCTimestamp }, { value: 32.37624709371832, time: 1634053368 as UTCTimestamp }, { value: 32.51457619610796, time: 1634658168 as UTCTimestamp }, { value: 32.289844763651196, time: 1635262968 as UTCTimestamp }, { value: 32.30345180071158, time: 1635867768 as UTCTimestamp }, { value: 31.338699866068282, time: 1636472568 as UTCTimestamp }, { value: 31.599431171640674, time: 1637077368 as UTCTimestamp }, { value: 31.19599059792039, time: 1637682168 as UTCTimestamp }, { value: 31.425624659001333, time: 1638286968 as UTCTimestamp }, { value: 30.687366192207392, time: 1638891768 as UTCTimestamp }, { value: 31.37955209658077, time: 1639496568 as UTCTimestamp }, { value: 30.44272814637675, time: 1640101368 as UTCTimestamp }, { value: 30.443425326447485, time: 1640706168 as UTCTimestamp }, { value: 30.402280371726427, time: 1641310968 as UTCTimestamp }, { value: 31.323860910479432, time: 1641915768 as UTCTimestamp }], blueData: [{ value: 31, time: 1628005368 as UTCTimestamp }, { value: 31.78679751621187, time: 1628610168 as UTCTimestamp }, { value: 31.73307428969506, time: 1629214968 as UTCTimestamp }, { value: 32.645659569228435, time: 1629819768 as UTCTimestamp }, { value: 32.18589215966293, time: 1630424568 as UTCTimestamp }, { value: 32.36649658122607, time: 1631029368 as UTCTimestamp }, { value: 32.13494929971301, time: 1631634168 as UTCTimestamp }, { value: 32.24176261787218, time: 1632238968 as UTCTimestamp }, { value: 32.23416002963385, time: 1632843768 as UTCTimestamp }, { value: 33.155464487194166, time: 1633448568 as UTCTimestamp }, { value: 32.30858974959849, time: 1634053368 as UTCTimestamp }, { value: 33.240351713622175, time: 1634658168 as UTCTimestamp }, { value: 32.476820033756304, time: 1635262968 as UTCTimestamp }, { value: 33.38322664774607, time: 1635867768 as UTCTimestamp }, { value: 33.112040840762795, time: 1636472568 as UTCTimestamp }, { value: 33.21270434841732, time: 1637077368 as UTCTimestamp }, { value: 32.34952853888793, time: 1637682168 as UTCTimestamp }, { value: 33.309373031504336, time: 1638286968 as UTCTimestamp }, { value: 32.68788509068168, time: 1638891768 as UTCTimestamp }, { value: 32.991148534675084, time: 1639496568 as UTCTimestamp }, { value: 32.019560141931144, time: 1640101368 as UTCTimestamp }, { value: 32.6775781486036, time: 1640706168 as UTCTimestamp }, { value: 31.739487272423506, time: 1641310968 as UTCTimestamp }, { value: 31.957098637385883, time: 1641915768 as UTCTimestamp }] };

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

			const layout = isDarkTheme
				? { background: { color: '#000000' }, textColor: 'rgba(248, 249, 253, 1)' }
				: { background: { color: 'rgba(248, 249, 253, 1)' }, textColor: '#000000' };

			const c = createChart(container, {
				layout,
				grid: {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					horzLines: false,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					vertLines: false,
				},
				timeScale: {
					fixLeftEdge: true,
					fixRightEdge: true,
				},
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

			orangeSeries.setData(data.orangeData);
			blueSeries.setData(data.blueData);

			c.timeScale().fitContent();

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

			const layout = isDarkTheme
				? { background: { color: '#000000' }, textColor: 'rgba(248, 249, 253, 1)' }
				: { background: { color: 'rgba(248, 249, 253, 1)' }, textColor: '#000000' };

			chart.applyOptions({ layout });
		},
		[isDarkTheme]
	);

	return (
		<div className={styles.HeroChartContainer} ref={ref}></div>
	);
}

function PerformanceIcon(): JSX.Element {
	return (
		<svg width="115" height="103" viewBox="0 0 115 104" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path fillRule="evenodd" clipRule="evenodd" d="M0.542969 61.0831C0.542969 27.8888 27.4523 0.979492 60.6466 0.979492C83.0612 0.979492 102.605 13.2511 112.933 31.4232L114.583 34.3262L112.022 36.4683L94.1488 51.4152L90.7484 54.2589L88.2677 50.5853C81.0752 39.9342 68.9035 32.9447 55.1008 32.9447C33.0152 32.9447 15.1113 50.8486 15.1113 72.9341C15.1113 82.6448 18.5674 91.5376 24.3208 98.4654L18.4342 103.868C7.39344 92.9744 0.542969 77.8251 0.542969 61.0831ZM60.6466 8.97949C31.8706 8.97949 8.54297 32.3071 8.54297 61.0831L8.54324 61.2519C13.7602 40.394 32.6263 24.9447 55.1008 24.9447C70.0858 24.9447 83.4649 31.8157 92.2606 42.5655L104.246 32.5425C94.932 18.3443 78.8807 8.97949 60.6466 8.97949ZM70.3306 67.5709L56.8895 78.9372L51.7238 72.8285L65.165 61.4623L70.3306 67.5709ZM77.9792 62C80.7407 62 82.9792 59.7614 82.9792 57C82.9792 54.2386 80.7407 52 77.9792 52C75.2178 52 72.9792 54.2386 72.9792 57C72.9792 59.7614 75.2178 62 77.9792 62Z" fill="#D1D4DC" />
		</svg>
	);
}

function ResponsiveIcon(): JSX.Element {
	return (
		<svg width="106" height="103" viewBox="0 0 106 85" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path fillRule="evenodd" clipRule="evenodd" d="M12 0H16H102H106V4V66V70H102H42V81V85H38H4H0V81V26V22H4H12V4V0ZM98 62H42V26V22H38H20V8H98V62ZM8 77H34V30H8V77ZM85 26C87.7614 26 90 23.7614 90 21C90 18.2386 87.7614 16 85 16C82.2386 16 80 18.2386 80 21C80 23.7614 82.2386 26 85 26Z" fill="#D1D4DC" />
		</svg>
	);
}

function HeartIcon(): JSX.Element {
	return (
		<svg width="111" height="103" viewBox="0 0 111 103" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path fillRule="evenodd" clipRule="evenodd" d="M10.9416 10.0063C-1.10293 22.0508 -3.60391 41.6017 8.08095 55.0113L8.06184 55.0298L8.35833 55.3255C9.17864 56.2426 10.0664 57.13 11.0233 57.9833L11.0534 58.0134L11.0564 58.0164C12.2644 59.2263 13.3137 60.308 14.2541 61.2774L14.3803 61.4075C15.8416 62.9141 17.1514 64.2645 18.3054 65.2643L53.1806 100.14L56.009 102.968L58.8375 100.14L98.4436 60.5334C99.4086 59.671 100.34 58.7383 101.234 57.7349C113.444 44.0321 114.441 23.3718 101.076 10.0072C88.7562 -2.31269 69.3061 -3.15662 56.0094 7.47537C42.7126 -3.15754 23.2618 -2.31389 10.9416 10.0063ZM14.953 50.6673C5.51438 40.8169 6.75071 25.5109 16.5984 15.6632C26.7001 5.56149 43.0782 5.56149 53.1799 15.6632L53.1799 15.6632L53.1799 15.6632L53.1799 15.6632L53.1799 15.6633L53.18 15.6633L53.18 15.6633L53.18 15.6633L53.1801 15.6634L53.1801 15.6634L53.1801 15.6635L53.1802 15.6635L53.1802 15.6635L53.1802 15.6636L53.1803 15.6636L53.1803 15.6636L53.1803 15.6636L53.1803 15.6637L53.1804 15.6637L53.1804 15.6637L53.1805 15.6638L53.1805 15.6638L53.1805 15.6639L53.1806 15.6639L53.1806 15.6639L53.1806 15.6639L53.1806 15.664L53.1807 15.664L53.1807 15.664L53.1807 15.6641L53.1808 15.6641L53.1808 15.6641L56.0093 18.4926L58.8377 15.6642L58.8377 15.6641L58.8377 15.6641L58.8378 15.6641L58.8378 15.6641L58.8378 15.6641L58.8378 15.664C68.9395 5.56236 85.3176 5.56236 95.4193 15.664C96.7758 17.0206 97.9414 18.4854 98.9183 20.0316L81.8148 36.4434C79.6101 34.876 76.9142 33.9543 74.0031 33.9543C68.2989 33.9543 63.4212 37.4929 61.4455 42.4947L50.8843 36.085L50.8845 36.0086C50.8845 28.5546 44.8418 22.5119 37.3878 22.5119C29.9338 22.5119 23.8912 28.5546 23.8912 36.0086C23.8912 37.8321 24.2528 39.5712 24.9083 41.1579L14.953 50.6673ZM102.172 27.9965C103.955 36.2331 101.575 45.3266 95.2612 52.4129C94.5432 53.2187 93.8022 53.957 93.0427 54.6307L92.9532 54.7101L92.8686 54.7947L56.009 91.6542L23.8558 59.501L23.7431 59.3883L23.6219 59.285C22.8707 58.6448 21.9459 57.7131 20.6037 56.3328L30.0323 47.3266C32.1482 48.7046 34.6745 49.5052 37.3878 49.5052C41.8962 49.5052 45.8882 47.2947 48.3393 43.8985L61.1876 51.6962C62.9669 57.0703 68.0322 60.9476 74.0031 60.9476C81.457 60.9476 87.4997 54.9049 87.4997 47.4509C87.4997 45.8346 87.2156 44.2847 86.6946 42.8483L102.172 27.9965ZM31.8912 36.0086C31.8912 32.9728 34.3521 30.5119 37.3878 30.5119C40.4235 30.5119 42.8845 32.9728 42.8845 36.0086C42.8845 39.0443 40.4235 41.5052 37.3878 41.5052C34.3521 41.5052 31.8912 39.0443 31.8912 36.0086ZM74.0031 41.9543C70.9673 41.9543 68.5064 44.4152 68.5064 47.4509C68.5064 50.4867 70.9673 52.9476 74.0031 52.9476C77.0388 52.9476 79.4997 50.4867 79.4997 47.4509C79.4997 44.4152 77.0388 41.9543 74.0031 41.9543Z" fill="#D1D4DC" />
		</svg>
	);
}

function PaperPlaneIcon(): JSX.Element {
	return (
		<svg width="44" height="44" viewBox="0 0 39 33" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path fillRule="evenodd" clipRule="evenodd" d="M38.7201 0.532471L28.7609 30.9602L20.3973 24.9339L12.9998 32.8823V19.4383L0.632812 11.1966L38.7201 0.532471ZM14.9998 20.904L18.7769 23.7393L14.9998 27.7978V20.904ZM20.8588 22.8013L27.711 27.7386L35.2736 4.63266L15.6813 18.9148L20.8588 22.8013ZM32.1182 4.45784L5.36683 11.948L13.9742 17.6842L32.1182 4.45784Z" fill="#2962FF" />
		</svg>
	);
}

function CogIcon(): JSX.Element {
	return (
		<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
			<g clipPath="url(#clip0_70_26322)">
				<path d="M10.9336 41.1008C13.8809 38.4939 17.7555 36.9116 21.9996 36.9116C26.2438 36.9116 30.1183 38.4939 33.0656 41.1008" stroke="#2962FF" strokeWidth="2" />
				<circle cx="22" cy="17.6602" r="6" stroke="#2962FF" strokeWidth="2" />
				<path d="M11.7799 6.04401L16.5407 3.29534L20.5381 6.10505L23.2671 6.04931L27.3856 3.07382L32.0354 5.63026L31.4192 10.3468L32.6032 12.753L37.266 14.6899L37.155 19.995L32.4071 22.124L31.1214 24.5808L31.5407 29.2761L26.7799 32.0248L22.7825 29.2151L20.0535 29.2708L15.9351 32.2463L11.2852 29.6899L11.9014 24.9734L10.7174 22.5671L6.05464 20.6303L6.16562 15.3251L10.1407 13.5426L12.1992 10.7394L11.7799 6.04401Z" stroke="#2962FF" strokeWidth="2" />
			</g>
			<defs>
				<clipPath id="clip0_70_26322">
					<rect width="44" height="44" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
}

function SlidersIcon(): JSX.Element {
	return (
		<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M4 11H13.772M40 11H20.6188" stroke="#2962FF" strokeWidth="2" />
			<path d="M4.00002 22H26.3232M40 22H33.0112" stroke="#2962FF" strokeWidth="2" />
			<path d="M4 33H8.60249M40 33H15.3392" stroke="#2962FF" strokeWidth="2" />
			<circle cx="17" cy="11" r="3" stroke="#2962FF" strokeWidth="2" />
			<circle cx="30" cy="22" r="3" stroke="#2962FF" strokeWidth="2" />
			<circle cx="12" cy="33" r="3" stroke="#2962FF" strokeWidth="2" />
		</svg>
	);
}

function ShapesIcon(): JSX.Element {
	return (
		<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M12 3C15.5294 8.41176 20 11 20 11C20 11 15.0588 13.5882 12 19C9.17647 14.0588 4 11 4 11C4 11 8.94118 8.41176 12 3Z" stroke="#2962FF" strokeWidth="2" />
			<circle cx="33" cy="34" r="8" stroke="#2962FF" strokeWidth="2" />
			<rect x="25" y="3" width="16" height="16" stroke="#2962FF" strokeWidth="2" />
			<path d="M12.0235 28.041L20.0469 42.041H4L12.0235 28.041Z" stroke="#2962FF" strokeWidth="2" />
		</svg>
	);
}

function Index(): JSX.Element {
	return (
		<Layout title="Lightweight Charts">
			<div className={styles.RootContainer}>
				<div className={styles.HeroContainer}>
					<HeroChart />
					<div className={styles.HeroTextContainer}>
						<Logo fillRule="evenodd" clipRule="evenodd" />
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
						<PerformanceIcon />
						<h2>High Performance</h2>
						<p>Our charting solutions were engineered from the start to work with huge data arrays. Charts stay responsive and nimble even with thousands of bars even with updates multiple times per second with new ticks.</p>
					</div>
					<div className={styles.LargeCard}>
						<ResponsiveIcon />
						<h2>Interactive, responsive and mobile-friendly</h2>
						<p>Intelligently adapts to any device. Charts are carefully engineered for best interactivity, both for powerful desktops with a mouse, and touch-optimized for tablets and phones.</p>
					</div>
					<div className={styles.LargeCard}>
						<HeartIcon />
						<h2>Finance is at the heart</h2>
						<p>Charting is our core. TradingView charts are used by tens of thousands of websites, apps and financial portals, as well as millions of traders around the world. You can be sure that we&apos;ve included everything you need, starting from popular chart types to advanced price scaling.</p>
					</div>
				</div>
				<div className={styles.SmallCardContainer}>
					<div className={styles.SmallCard}>
						<PaperPlaneIcon />
						<h3>Ultra lightweight - just 40 Kb</h3>
						<p>HTML5 Canvas technology no larger than a standard GIF file.</p>
					</div>
					<div className={styles.SmallCard}>
						<CogIcon />
						<h3>Integrating & connecting any data is quick and easy</h3>
						<p>Built for developers, by developers. Charts are rich in features and easy to integrate — so you can integrate with a breeze.</p>
					</div>
					<div className={styles.SmallCard}>
						<SlidersIcon />
						<h3>Open-source </h3>
						<p>Fully customizable & free charts that don&apos;t contain hidden ads. Contributions are welcome!</p>
					</div>
					<div className={styles.SmallCard}>
						<ShapesIcon />
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
