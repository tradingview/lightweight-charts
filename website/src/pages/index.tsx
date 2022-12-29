import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import React from 'react';

import Cards, { CardLink } from '../components/landing-page/Cards';
import { CTALink } from '../components/landing-page/CTAButton';
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

// const { colorMode } = useColorMode();
// const isDarkTheme = colorMode === 'dark';

// function isScreenMinimumWidthForDisplayingChart(): boolean {
// 	return window.matchMedia('screen and (min-width: 1279.5px)').matches;
// }

function readBundleSize(): unknown {
	const { siteConfig } = useDocusaurusContext();
	return siteConfig.customFields?.bundleSize;
}

function Index(): JSX.Element {
	return (
		<div className={styles.RootContainer}>
			<Hero ctaLinks={ctaLinks} />
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
