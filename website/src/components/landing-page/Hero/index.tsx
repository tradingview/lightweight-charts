import React from 'react';

import { type CodeBlockProps } from '../Codeblock';
import CTAButton, { CTALink } from '../CTAButton';
import HeroChart from '../HeroChart';
import styles from './hero.module.css';

export default function Hero(props: {
	ctaLinks: CTALink[];
	codeBlocks?: CodeBlockProps[];
	header: string | React.JSX.Element;
	paragraph: string | React.JSX.Element;
}): React.JSX.Element {
	const { header, paragraph, ctaLinks, codeBlocks } = props;
	return (
		<section className={styles.HeroContainer}>
			<main className={styles.HeroMain}>
				<h1>{header}</h1>
				<p>{paragraph}</p>
				<nav className={styles.HeroButtons}>
					{ctaLinks.map((link: CTALink) => (
						<CTAButton key={link.link} {...link} />
					))}
				</nav>
			</main>
			<HeroChart codeBlocks={codeBlocks ?? []} />
		</section>
	);
}
