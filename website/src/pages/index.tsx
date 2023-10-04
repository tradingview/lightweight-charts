import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import React from 'react';

import Banner from '../components/landing-page/Banner';
import Cards, { type CardLink } from '../components/landing-page/Cards';
import { type CodeBlockProps } from '../components/landing-page/Codeblock';
import { type CTALink } from '../components/landing-page/CTAButton';
import Hero from '../components/landing-page/Hero';
import styles from './index.module.css';

const cardLinks: CardLink[] = [
	{
		title: 'Getting started',
		link: 'docs',
		content: 'Discover how to install the library, and create your first chart',
	},
	{
		title: 'Tutorials',
		link: 'tutorials',
		content: 'Tutorials, examples, and framework integrations',
	},
	{
		title: 'API reference',
		link: 'docs/api',
		content: 'View the API reference documentation',
	},
	{
		title: 'GitHub issues',
		link: 'https://github.com/tradingview/lightweight-charts/issues',
		content: 'Report a bug, or get answers to your questions',
	},
];

const ctaLinks: CTALink[] = [
	{
		title: 'Get started',
		link: 'docs',
		primary: true,
	},
	{
		title: 'Explore features',
		link: 'https://www.tradingview.com/lightweight-charts/',
		external: true,
	},
];

const codeBlocks: CodeBlockProps[] = [
	{
		startLineNumber: 1,
		lineNumberOverrides: ['~$', ''],
		canCopy: true,
		canSelect: true,
		style: {
			left: '20%',
			bottom: -28,
			transformOrigin: 'center left',
		},
		name: 'npm',
		lines: [
			<span key="1">npm install</span>,
			<span key="2">&nbsp;&nbsp;&nbsp;&nbsp;--save lightweight-charts</span>,
		],
	},
	{
		startLineNumber: 1,
		canCopy: false,
		canSelect: false,
		style: {
			right: 'var(--right-code-block-position)',
			top: 'var(--import-code-block-top-position)',
			transformOrigin: 'center right',
		},
		name: 'import',
		lines: [
			<span key="1">
				<span>import</span>
				<span>{' { '}</span>createChart<span>{' } '}</span>
				<span> from</span>
			</span>,
			<span key="2">
				&nbsp;&nbsp;<span>{`'lightweight-charts'`}</span>;
			</span>,
			<span key="3">
				<span>const</span> chart =
			</span>,
			<span key="4">
				&nbsp;&nbsp;<span>createChart</span>
				<span>{'('}</span>container<span>{')'}</span>;
			</span>,
		],
	},
	{
		startLineNumber: 39,
		canCopy: false,
		canSelect: false,
		style: {
			left: `calc(-1 * var(--hero-chart-padding-left) + var(--main-code-block-left-adjustment))`,
			top: -20,
			transformOrigin: 'top left',
			maxWidth: '489px',
		},
		name: 'chart-code',
		lines: [
			<span key="1">
				<span data-c3>const</span> chartOptions =<span>{' { '}</span>
				layout: <span>{' { '}</span> background:
			</span>,
			<span key="2">
				&nbsp;&nbsp;<span>{' { '}</span>type: <span data-c1>{`'solid'`}</span>,
				color: <span data-c1>{`'transparent'`}</span>
				<span>{' } '}</span>
				<span>{' } '}</span>
				<span>{' }'}</span>;
			</span>,
			<span key="3">
				<span data-c3>const</span> chart = <span data-c4>createChart</span>
				<span>{'('}</span>container, chartOptions
				<span>{')'}</span>;
			</span>,
			<span key="4">
				<span data-c3>const</span> areaSeries = chart.
				<span data-c4>addAreaSeries</span>
				<span>{'('}</span>
				<span>{'{ '}</span>
			</span>,
			<span key="5">
				&nbsp;&nbsp;lineColor: <span data-c1>{`'#2962ff'`}</span>, topColor:{' '}
				<span data-c1>{`'#2962ff'`}</span>,
			</span>,
			<span key="6">
				&nbsp;&nbsp;bottomColor:{' '}
				<span data-c1>{`'rgba(41, 98, 255, 0.28)'`}</span>
				<span>{' }'}</span>
				<span>{')'}</span>;
			</span>,
			// <span key="7">
			// 	areaSeries.<span data-c4>setData</span>
			// 	<span>{'('}</span>
			// 	<span>{'['}</span>
			// 	{' /* ... */ '}
			// 	<span>{']'}</span>
			// 	<span>{')'}</span>;
			// </span>,
		],
	},
	{
		startLineNumber: 38,
		canCopy: false,
		canSelect: false,
		style: {
			right: -12,
			top: -8,
			transformOrigin: 'top right',
			// width: 550,
			maxWidth: 'calc(100vw - 60px)',
		},
		name: 'chart-code-phone',
		lines: [
			<span key="3">
				<span data-c4>createChart</span>
				<span>{'('}</span>container, chartOptions
				<span>{')'}</span>;
			</span>,
			<span key="4">
				<span data-c3>const</span> areaSeries =
			</span>,
			<span key="5">
				&nbsp;&nbsp;chart.
				<span data-c4>addAreaSeries</span>
				<span>{'('}</span>
				<span>{'{ '}</span>lineColor:
			</span>,
			<span key="6">
				&nbsp;&nbsp;&nbsp;&nbsp;<span data-c1>{`'#2962ff'`}</span>, topColor:{' '}
				<span data-c1>{`'#2962ff'`}</span>,
			</span>,
			<span key="7">
				&nbsp;&nbsp;&nbsp;&nbsp;bottomColor:{' '}
				<span data-c1>{`'rgba(41, 98, 255,'`}</span>
			</span>,
			<span key="8">
				&nbsp;&nbsp;&nbsp;&nbsp;<span data-c1>{`'0.28)'`}</span>
				<span>{' }'}</span>
				<span>{')'}</span>;
			</span>,
		],
	},
];

const header = 'Lightweight Charts™ Documentation';
const paragraph = `Lightweight Charts™ is a library for creating interactive financial charts. This documentation site provides all the information needed to get started with Lightweight Charts™ and help you make the most of its features.`;

const showBanner = true;

function Index(): React.JSX.Element {
	return (
		<>
			{showBanner ? (
				<Banner
					text="Exciting Update: Version 4.1 now available, introducing plugin support for enhanced functionality."
					link="https://tradingview.github.io/lightweight-charts/docs/release-notes#410"
					linkText="Read more"
				/>
			) : (
				''
			)}
			<div className={styles.RootContainer}>
				<Hero
					ctaLinks={ctaLinks}
					codeBlocks={codeBlocks}
					header={header}
					paragraph={paragraph}
				/>
				<Cards cardLinks={cardLinks} />
			</div>
		</>
	);
}

function LayoutWrapper(): React.JSX.Element {
	return (
		<Layout title="Home" description={paragraph}>
			<Head>
				<link
					rel="preload"
					href="https://fonts.cdnfonts.com/s/60249/Euclid Circular B SemiBold.woff"
					as="font"
					type="font/woff"
					crossOrigin="anonymous"
				/>
				<link
					rel="preload"
					href="https://fonts.cdnfonts.com/s/13494/Menlo-Regular.woff"
					as="font"
					type="font/woff"
					crossOrigin="anonymous"
				/>
			</Head>
			<Index />
		</Layout>
	);
}

export default LayoutWrapper;
