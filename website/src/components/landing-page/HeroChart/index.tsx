import React from 'react';

import CodeBlock, { CodeBlockProps } from '../Codeblock';
import styles from './index.module.css';

export default function HeroChart(props: {
	codeBlocks: CodeBlockProps[];
}): JSX.Element {
	return (
		<section className={styles.HeroChartSection}>
			<div className={styles.HeroChartGradient}></div>
			<div className={styles.HeroChartGlass}></div>
			<figure className={styles.HeroChartFigure}></figure>
			{props.codeBlocks.map((codeBlock: CodeBlockProps) => (
				<CodeBlock key={codeBlock.name} {...codeBlock} />
			))}
			<div className={styles.HeroChartFadeBottom}></div>
			<div className={styles.HeroChartFadeBottomDeep}></div>
		</section>
	);
}
