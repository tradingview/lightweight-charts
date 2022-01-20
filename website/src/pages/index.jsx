import React from 'react';
import Layout from '@theme/Layout';
import useThemeContext from '@theme/hooks/useThemeContext';

import { createChart } from 'lightweight-charts';

import styles from './index.module.css';

function classes(...names) {
	return names.map(name => styles[name]).join(' ');
}

const data = { orangeData: [{ value: 33, time: 1628005368 }, { value: 33.49774076716826, time: 1628610168 }, { value: 33.00544183567645, time: 1629214968 }, { value: 33.7026637942526, time: 1629819768 }, { value: 33.21936886405405, time: 1630424568 }, { value: 33.900609590144896, time: 1631029368 }, { value: 33.17765657755362, time: 1631634168 }, { value: 33.42924174402081, time: 1632238968 }, { value: 33.11836183231501, time: 1632843768 }, { value: 33.370546260351574, time: 1633448568 }, { value: 32.37624709371832, time: 1634053368 }, { value: 32.51457619610796, time: 1634658168 }, { value: 32.289844763651196, time: 1635262968 }, { value: 32.30345180071158, time: 1635867768 }, { value: 31.338699866068282, time: 1636472568 }, { value: 31.599431171640674, time: 1637077368 }, { value: 31.19599059792039, time: 1637682168 }, { value: 31.425624659001333, time: 1638286968 }, { value: 30.687366192207392, time: 1638891768 }, { value: 31.37955209658077, time: 1639496568 }, { value: 30.44272814637675, time: 1640101368 }, { value: 30.443425326447485, time: 1640706168 }, { value: 30.402280371726427, time: 1641310968 }, { value: 31.323860910479432, time: 1641915768 }], blueData: [{ value: 31, time: 1628005368 }, { value: 31.78679751621187, time: 1628610168 }, { value: 31.73307428969506, time: 1629214968 }, { value: 32.645659569228435, time: 1629819768 }, { value: 32.18589215966293, time: 1630424568 }, { value: 32.36649658122607, time: 1631029368 }, { value: 32.13494929971301, time: 1631634168 }, { value: 32.24176261787218, time: 1632238968 }, { value: 32.23416002963385, time: 1632843768 }, { value: 33.155464487194166, time: 1633448568 }, { value: 32.30858974959849, time: 1634053368 }, { value: 33.240351713622175, time: 1634658168 }, { value: 32.476820033756304, time: 1635262968 }, { value: 33.38322664774607, time: 1635867768 }, { value: 33.112040840762795, time: 1636472568 }, { value: 33.21270434841732, time: 1637077368 }, { value: 32.34952853888793, time: 1637682168 }, { value: 33.309373031504336, time: 1638286968 }, { value: 32.68788509068168, time: 1638891768 }, { value: 32.991148534675084, time: 1639496568 }, { value: 32.019560141931144, time: 1640101368 }, { value: 32.6775781486036, time: 1640706168 }, { value: 31.739487272423506, time: 1641310968 }, { value: 31.957098637385883, time: 1641915768 }] };

function useWindowInnerWidth() {
	const [width, setWidth] = React.useState(window.innerWidth);

	const resizeListener = () => {
		setWidth(window.innerWidth);
	};

	React.useEffect(() => {
		window.addEventListener('resize', resizeListener);

		return () => {
			window.removeEventListener('resize', resizeListener);
		};
	}, []);

	return width;
}

function HeroChart(props) {
	const ref = React.useRef();

	const { isDarkTheme } = useThemeContext();

	const [chart, setChart] = React.useState(null);

	React.useLayoutEffect(() => {
		const container = ref.current;

		const layout = isDarkTheme
			? { background: { color: '#000000' }, textColor: 'rgba(248, 249, 253, 1)' }
			: { background: { color: 'rgba(248, 249, 253, 1)' }, textColor: '#000000' };

		const c = createChart(container, {
			grid: {
				horzLines: false,
				vertLines: false,
			},
			layout,
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
			setChart(null);
		};
	}, []);

	React.useLayoutEffect(() => {
		if (!chart) {
			return;
		}

		const layout = isDarkTheme
			? { background: { color: '#000000' }, textColor: 'rgba(248, 249, 253, 1)' }
			: { background: { color: 'rgba(248, 249, 253, 1)' }, textColor: '#000000' };

		chart.applyOptions({ layout });
	}, [isDarkTheme]);

	return (
		<div className={styles.HeroChartContainer} ref={ref}></div>
	);
}

function PerformanceIcon() {
	return (
		<svg width="115" height="104" viewBox="0 0 115 104" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path fillRule="evenodd" clipRule="evenodd" d="M0.542969 61.0831C0.542969 27.8888 27.4523 0.979492 60.6466 0.979492C83.0612 0.979492 102.605 13.2511 112.933 31.4232L114.583 34.3262L112.022 36.4683L94.1488 51.4152L90.7484 54.2589L88.2677 50.5853C81.0752 39.9342 68.9035 32.9447 55.1008 32.9447C33.0152 32.9447 15.1113 50.8486 15.1113 72.9341C15.1113 82.6448 18.5674 91.5376 24.3208 98.4654L18.4342 103.868C7.39344 92.9744 0.542969 77.8251 0.542969 61.0831ZM60.6466 8.97949C31.8706 8.97949 8.54297 32.3071 8.54297 61.0831L8.54324 61.2519C13.7602 40.394 32.6263 24.9447 55.1008 24.9447C70.0858 24.9447 83.4649 31.8157 92.2606 42.5655L104.246 32.5425C94.932 18.3443 78.8807 8.97949 60.6466 8.97949ZM70.3306 67.5709L56.8895 78.9372L51.7238 72.8285L65.165 61.4623L70.3306 67.5709ZM77.9792 62C80.7407 62 82.9792 59.7614 82.9792 57C82.9792 54.2386 80.7407 52 77.9792 52C75.2178 52 72.9792 54.2386 72.9792 57C72.9792 59.7614 75.2178 62 77.9792 62Z" fill="#D1D4DC" />
		</svg>
	);
}

function ResponsiveIcon() {
	return (
		<svg width="106" height="85" viewBox="0 0 106 85" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path fillRule="evenodd" clipRule="evenodd" d="M12 0H16H102H106V4V66V70H102H42V81V85H38H4H0V81V26V22H4H12V4V0ZM98 62H42V26V22H38H20V8H98V62ZM8 77H34V30H8V77ZM85 26C87.7614 26 90 23.7614 90 21C90 18.2386 87.7614 16 85 16C82.2386 16 80 18.2386 80 21C80 23.7614 82.2386 26 85 26Z" fill="#D1D4DC" />
		</svg>
	);
}

function HeartIcon() {
	return (
		<svg width="111" height="103" viewBox="0 0 111 103" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path fillRule="evenodd" clipRule="evenodd" d="M10.9416 10.0063C-1.10293 22.0508 -3.60391 41.6017 8.08095 55.0113L8.06184 55.0298L8.35833 55.3255C9.17864 56.2426 10.0664 57.13 11.0233 57.9833L11.0534 58.0134L11.0564 58.0164C12.2644 59.2263 13.3137 60.308 14.2541 61.2774L14.3803 61.4075C15.8416 62.9141 17.1514 64.2645 18.3054 65.2643L53.1806 100.14L56.009 102.968L58.8375 100.14L98.4436 60.5334C99.4086 59.671 100.34 58.7383 101.234 57.7349C113.444 44.0321 114.441 23.3718 101.076 10.0072C88.7562 -2.31269 69.3061 -3.15662 56.0094 7.47537C42.7126 -3.15754 23.2618 -2.31389 10.9416 10.0063ZM14.953 50.6673C5.51438 40.8169 6.75071 25.5109 16.5984 15.6632C26.7001 5.56149 43.0782 5.56149 53.1799 15.6632L53.1799 15.6632L53.1799 15.6632L53.1799 15.6632L53.1799 15.6633L53.18 15.6633L53.18 15.6633L53.18 15.6633L53.1801 15.6634L53.1801 15.6634L53.1801 15.6635L53.1802 15.6635L53.1802 15.6635L53.1802 15.6636L53.1803 15.6636L53.1803 15.6636L53.1803 15.6636L53.1803 15.6637L53.1804 15.6637L53.1804 15.6637L53.1805 15.6638L53.1805 15.6638L53.1805 15.6639L53.1806 15.6639L53.1806 15.6639L53.1806 15.6639L53.1806 15.664L53.1807 15.664L53.1807 15.664L53.1807 15.6641L53.1808 15.6641L53.1808 15.6641L56.0093 18.4926L58.8377 15.6642L58.8377 15.6641L58.8377 15.6641L58.8378 15.6641L58.8378 15.6641L58.8378 15.6641L58.8378 15.664C68.9395 5.56236 85.3176 5.56236 95.4193 15.664C96.7758 17.0206 97.9414 18.4854 98.9183 20.0316L81.8148 36.4434C79.6101 34.876 76.9142 33.9543 74.0031 33.9543C68.2989 33.9543 63.4212 37.4929 61.4455 42.4947L50.8843 36.085L50.8845 36.0086C50.8845 28.5546 44.8418 22.5119 37.3878 22.5119C29.9338 22.5119 23.8912 28.5546 23.8912 36.0086C23.8912 37.8321 24.2528 39.5712 24.9083 41.1579L14.953 50.6673ZM102.172 27.9965C103.955 36.2331 101.575 45.3266 95.2612 52.4129C94.5432 53.2187 93.8022 53.957 93.0427 54.6307L92.9532 54.7101L92.8686 54.7947L56.009 91.6542L23.8558 59.501L23.7431 59.3883L23.6219 59.285C22.8707 58.6448 21.9459 57.7131 20.6037 56.3328L30.0323 47.3266C32.1482 48.7046 34.6745 49.5052 37.3878 49.5052C41.8962 49.5052 45.8882 47.2947 48.3393 43.8985L61.1876 51.6962C62.9669 57.0703 68.0322 60.9476 74.0031 60.9476C81.457 60.9476 87.4997 54.9049 87.4997 47.4509C87.4997 45.8346 87.2156 44.2847 86.6946 42.8483L102.172 27.9965ZM31.8912 36.0086C31.8912 32.9728 34.3521 30.5119 37.3878 30.5119C40.4235 30.5119 42.8845 32.9728 42.8845 36.0086C42.8845 39.0443 40.4235 41.5052 37.3878 41.5052C34.3521 41.5052 31.8912 39.0443 31.8912 36.0086ZM74.0031 41.9543C70.9673 41.9543 68.5064 44.4152 68.5064 47.4509C68.5064 50.4867 70.9673 52.9476 74.0031 52.9476C77.0388 52.9476 79.4997 50.4867 79.4997 47.4509C79.4997 44.4152 77.0388 41.9543 74.0031 41.9543Z" fill="#D1D4DC" />
		</svg>
	);
}

function PaperPlaneIcon() {
	return (
		<svg width="39" height="33" viewBox="0 0 39 33" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path fillRule="evenodd" clipRule="evenodd" d="M38.7201 0.532471L28.7609 30.9602L20.3973 24.9339L12.9998 32.8823V19.4383L0.632812 11.1966L38.7201 0.532471ZM14.9998 20.904L18.7769 23.7393L14.9998 27.7978V20.904ZM20.8588 22.8013L27.711 27.7386L35.2736 4.63266L15.6813 18.9148L20.8588 22.8013ZM32.1182 4.45784L5.36683 11.948L13.9742 17.6842L32.1182 4.45784Z" fill="#2962FF" />
		</svg>
	);
}

function CogIcon() {
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

function SlidersIcon() {
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

function ShapesIcon() {
	return (
		<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M12 3C15.5294 8.41176 20 11 20 11C20 11 15.0588 13.5882 12 19C9.17647 14.0588 4 11 4 11C4 11 8.94118 8.41176 12 3Z" stroke="#2962FF" strokeWidth="2" />
			<circle cx="33" cy="34" r="8" stroke="#2962FF" strokeWidth="2" />
			<rect x="25" y="3" width="16" height="16" stroke="#2962FF" strokeWidth="2" />
			<path d="M12.0235 28.041L20.0469 42.041H4L12.0235 28.041Z" stroke="#2962FF" strokeWidth="2" />
		</svg>
	);
}

function Index() {
	return (
		<Layout title="Lightweight Charts">
			<div className={styles.RootContainer}>
				<div className={styles.HeroContainer}>
					<HeroChart />
					<div className={styles.HeroTextContainer}>
						<svg width="91" height="55" viewBox="0 0 91 55" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path fillRule="evenodd" clipRule="evenodd" d="M86.5096 9.17833C87.8483 6.37042 89.1087 3.31636 90.2664 0L87.4861 0.788084C86.4704 3.54527 85.3838 6.10206 84.2428 8.47031C75.4834 13.8751 64.9901 12.8237 57.3572 8.60601L55.6002 7.54733C55.3234 8.93097 55.5748 10.4745 55.6928 11.199L55.7131 11.324C55.8231 12.0128 56.0023 12.8068 56.227 13.6432C56.4596 14.5093 56.7456 15.4382 57.0648 16.3667C56.299 15.8335 55.5494 15.0829 54.8593 14.1224C53.519 12.2572 52.4895 9.70967 52.0826 6.8229L51.9826 6.1134L51.3061 5.87718C33.6184 -0.299498 10.7551 6.4745 0.466449 24.1489L0.193848 24.6172L0.37285 25.1286C4.30395 36.3603 13.5495 46.4481 24.7847 51.2231L25.0051 51.3167L25.2469 51.3167L25.2498 51.3167L25.2576 51.3167L25.2807 51.3164L25.3136 51.3159L25.3564 51.3148C25.4197 51.313 25.5086 51.3096 25.6219 51.303C25.8483 51.2899 26.172 51.2643 26.5821 51.2142C27.4022 51.1139 28.5686 50.9157 29.9946 50.5236C32.2974 49.8903 35.2744 48.7519 38.5583 46.7077C38.3616 47.2602 38.1137 47.8358 37.8197 48.412C37.0137 49.9918 35.6163 51.9233 32.8479 53.8152L35.4041 54.3005C46.55 56.4168 59.6537 53.1714 69.7962 45.4072C79.9608 37.626 87.191 25.2739 86.5096 9.17833ZM82.3598 12.1248C74.2296 15.7745 65.2539 14.9207 58.1637 11.6473C58.2519 12.0705 58.3642 12.5369 58.4975 13.0334C58.9197 14.6051 59.5347 16.4146 60.1978 18.006L60.9929 19.9142C58.2451 19.8903 54.5224 17.6827 52.95 15.4943C51.4837 13.4537 50.385 10.8073 49.8689 7.8728C33.397 2.47969 12.4459 8.81566 2.77533 24.864C4.39063 29.2717 6.87524 33.4876 9.99585 37.221L29.9334 22.0187C29.435 21.1282 29.1509 20.1016 29.1509 19.0087C29.1509 15.6003 31.914 12.8372 35.3224 12.8372C38.7308 12.8372 41.4939 15.6003 41.4939 19.0087C41.4939 20.209 41.1512 21.3294 40.5583 22.2771L49.2468 30.9656C50.3394 29.9847 51.784 29.3881 53.3679 29.3881C56.2767 29.3881 58.7155 31.4004 59.368 34.1089C66.267 31.6824 75.1439 25.2262 82.3598 12.1248ZM59.4588 36.5594C67.0127 34.1292 76.5012 27.3688 84.1337 13.7696C83.406 26.8349 77.0142 36.9209 68.3671 43.5404C59.3893 50.413 48.0149 53.5211 38.0791 52.3353C38.7802 51.4673 39.4041 50.4797 39.9139 49.4805C40.8103 47.7236 41.4421 45.7576 41.4421 44.1324L41.4421 41.8126L39.5714 43.1844C35.6025 46.095 31.9802 47.5392 29.3712 48.2567C28.0658 48.6156 27.0131 48.7929 26.2969 48.8805C25.9388 48.9243 25.665 48.9456 25.486 48.9559L25.466 48.9571C20.2488 46.6967 15.4829 43.2134 11.5547 38.9889L31.4528 23.8166C32.5113 24.6696 33.8572 25.1802 35.3224 25.1802C36.6802 25.1802 37.9357 24.7416 38.9548 23.9985L47.8165 32.8602C47.4193 33.6756 47.1964 34.5915 47.1964 35.5595C47.1964 38.968 49.9595 41.731 53.3679 41.731C56.4359 41.731 58.981 39.4923 59.4588 36.5594ZM39.1428 19.0087C39.1428 21.1186 37.4324 22.8291 35.3224 22.8291C33.2124 22.8291 31.5019 21.1186 31.5019 19.0087C31.5019 16.8987 33.2124 15.1882 35.3224 15.1882C37.4324 15.1882 39.1428 16.8987 39.1428 19.0087ZM53.3679 39.38C55.3008 39.38 57.0708 37.7789 57.0708 35.5595C57.0708 33.3402 55.3008 31.7391 53.3679 31.7391C51.435 31.7391 49.665 33.3402 49.665 35.5595C49.665 37.7789 51.435 39.38 53.3679 39.38Z" fill="white" />
						</svg>
						<h1>Lightweight Charts</h1>
						<p>Free, open-source and feature-rich. At just 40 kilobytes, the dream of lightweight interactive charts is now a reality.</p>
						<div className={styles.HeroButtonsContainer}>
							<a className={classes('HeroButtonPrimary', 'HeroButton')} href="docs">Get Started</a>
							<a className={classes('HeroButton')} href="docs/api">API Reference</a>
						</div>
					</div>
				</div>
				<div className={styles.LargeTextContainer}>
					<h1>Fully customizable & free charts that don’t contain hidden ads</h1>
					<p>Millions of websites still use static pictures for showing financial charts. The old way is not interactive and doesn’t scale with various devices. Pictures always had a huge advantage of their small size and fast loading — but no more!</p>
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
						<p>Charting is our core. TradingView charts are used by tens of thousands of websites, apps and financial portals, as well as millions of traders around the world. You can be sure that we’ve included everything you need, starting from popular chart types to advanced price scaling.</p>
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
						<p>Fully customizable & free charts that don’t contain hidden ads. Contributions are welcome!</p>
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
