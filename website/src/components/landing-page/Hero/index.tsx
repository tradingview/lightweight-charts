import React from 'react';

import { type CodeBlockProps } from '../Codeblock';
import CTAButton, { CTALink } from '../CTAButton';
import HeroChart from '../HeroChart';
import styles from './index.module.css';

export default function Hero(props: { ctaLinks: CTALink[]; codeBlocks?: CodeBlockProps[] }): JSX.Element {
	return (
		<section className={styles.HeroContainer}>
			<main className={styles.HeroMain}>
				<h1>Lightweight Charts Documentation</h1>
				<p>
					Lightweight Charts is a library for creating interactive financial
					charts. Take a look at this documentation give you the information you
					need to start your lightweight journey.
				</p>
				<nav className={styles.HeroButtons}>
					{props.ctaLinks.map((link: CTALink) => (
						<CTAButton key={link.link} {...link} />
					))}
				</nav>
			</main>
			<HeroChart codeBlocks={props.codeBlocks ?? []}/>
		</section>
	);
}
