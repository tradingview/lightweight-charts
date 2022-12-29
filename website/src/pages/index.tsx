import Layout from '@theme/Layout';
import React from 'react';

import Cards, { type CardLink } from '../components/landing-page/Cards';
import { type CodeBlockProps } from '../components/landing-page/Codeblock';
import { type CTALink } from '../components/landing-page/CTAButton';
import Hero from '../components/landing-page/Hero';
import styles from './index.module.css';
// import { useColorMode } from '@docusaurus/theme-common';

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
		lineNumberOverrides: ['$', ''],
		canCopy: true,
		canSelect: true,
		style: {
			left: 150,
			bottom: -28,
			transformOrigin: 'center left',
		},
		name: 'npm',
		lines: [
			<span key="1">npm install</span>,
			<span key="2">&nbsp;&nbsp;--save lightweight-charts</span>,
		],
	},
	{
		startLineNumber: 1,
		// lineNumberOverrides: ['1', '', '2', ''],
		canCopy: false,
		canSelect: false,
		style: {
			right: 'var(--right-code-block-position)', // -20,
			top: '35%',
			transformOrigin: 'center right',
		},
		name: 'import',
		lines: [
			<span key="1">
				<span data-c3>import</span>
				<span data-c2>{' { '}</span>createChart<span data-c2>{' } '}</span>
				<span data-c3> from</span>
			</span>,
			<span key="2">
				&nbsp;&nbsp;<span data-c1>{`'lightweight-charts'`}</span>;
			</span>,
			<span key="3">
				<span data-c3>const</span> chart =
			</span>,
			<span key="4">
				&nbsp;&nbsp;<span data-c4>createChart</span>
				<span data-c2>{'('}</span>container<span data-c2>{')'}</span>;
			</span>,
		],
	},
	{
		startLineNumber: 39,
		// lineNumberOverrides: ['39', '', '40', '41', '', '', '42'],
		canCopy: false,
		canSelect: false,
		style: {
			left: `calc(-1 * var(--hero-chart-padding-left))`,
			top: -20,
			transformOrigin: 'top left',
		},
		name: 'chart-code',
		lines: [
			<span key="1">
				<span data-c3>const</span> chartOptions =<span data-c2>{' { '}</span>
				layout: <span data-c2>{' { '}</span> background:
				<span data-c2>{' { '}</span>
			</span>,
			<span key="2">
				&nbsp;&nbsp;type: <span data-c1>{`'solid'`}</span>, color:{' '}
				<span data-c1>{`'transparent'`}</span>
				<span data-c2>{' } '}</span>
				<span data-c2>{' } '}</span>
				<span data-c2>{' }'}</span>;
			</span>,
			<span key="3">
				<span data-c3>const</span> chart = <span data-c4>createChart</span>
				<span data-c2>{'('}</span>container, chartOptions
				<span data-c2>{')'}</span>;
			</span>,
			<span key="4">
				<span data-c3>const</span> areaSeries = chart.
				<span data-c4>addAreaSeries</span>
				<span data-c2>{'('}</span>
				<span data-c2>{'{ '}</span>
			</span>,
			<span key="5">
				&nbsp;&nbsp;lineColor: <span data-c1>{`'#2962ff'`}</span>, topColor:{' '}
				<span data-c1>{`'#2962ff'`}</span>,
			</span>,
			<span key="6">
				&nbsp;&nbsp;bottomColor:{' '}
				<span data-c1>{`'rgba(41, 98, 255, 0.28)'`}</span>
				<span data-c2>{' }'}</span>
				<span data-c2>{')'}</span>;
			</span>,
			<span key="7">
				areaSeries.<span data-c4>setData</span>
				<span data-c2>{'('}</span>
				<span data-c3>{'['}</span>
				{' /* ... */ '}
				<span data-c3>{']'}</span>
				<span data-c2>{')'}</span>;
			</span>,
		],
	},
];

// const { colorMode } = useColorMode();
// const isDarkTheme = colorMode === 'dark';

// function isScreenMinimumWidthForDisplayingChart(): boolean {
// 	return window.matchMedia('screen and (min-width: 1279.5px)').matches;
// }

function Index(): JSX.Element {
	return (
		<div className={styles.RootContainer}>
			<Hero ctaLinks={ctaLinks} codeBlocks={codeBlocks} />
			<Cards cardLinks={cardLinks} />
		</div>
	);
}

function LayoutWrapper(): JSX.Element {
	return (
		<Layout title="Home">
			<Index />
		</Layout>
	);
}

export default LayoutWrapper;
