import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import React, { ComponentPropsWithoutRef } from 'react';
// import { useColorMode } from '@docusaurus/theme-common';

import styles from './index.module.css';

interface CardLink {
	title: string;
	link: string;
	content: string;
}

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

// const { colorMode } = useColorMode();
// const isDarkTheme = colorMode === 'dark';

// function isScreenMinimumWidthForDisplayingChart(): boolean {
// 	return window.matchMedia('screen and (min-width: 1279.5px)').matches;
// }

function readBundleSize(): unknown {
	const { siteConfig } = useDocusaurusContext();
	return siteConfig.customFields?.bundleSize;
}

function Hero(): JSX.Element {
	return (
		<section className={styles.HeroContainer}>
			<div>Here would be the hero... Library is {readBundleSize()}kb.</div>
		</section>
	);
}

function ArrowSVG(): JSX.Element {
	return (
		<svg height={28} width={28}>
			<g clipPath="url(#clip0_1507_70976)">
				<path
					d="M11 8L17 14L11 20"
					stroke="var(--arrow-fill-color, #131722)"
                    fill="none"
					strokeWidth="3"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</g>
			<defs>
				<clipPath id="clip0_1507_70976">
					<rect width="28" height="28" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
}

function Card(cardData: CardLink): JSX.Element {
	return (
		<a href={cardData.link} className={styles.Card}>
			<div className={styles.CardHeader}>
				<h2>{cardData.title}</h2>
				<ArrowSVG />
			</div>
			<p>{cardData.content}</p>
		</a>
	);
}

function Cards(): JSX.Element {
	const cards = cardLinks.map((cardData: CardLink) => (
		<Card key={cardData.title} {...cardData} />
	));
	return <section className={styles.CardsContainer}>{cards}</section>;
}

function Index(): JSX.Element {
	return (
		<div className={styles.RootContainer}>
			<Hero />
			<Cards />
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
