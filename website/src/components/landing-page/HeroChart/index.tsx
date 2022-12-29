import React from 'react';

import styles from './index.module.css';

export default function HeroChart(): JSX.Element {
	return (
		<section className={styles.HeroChartSection}>
			<div className={styles.HeroChartGradient}></div>
			<div className={styles.HeroChartGlass}></div>
			<figure className={styles.HeroChartFigure}></figure>
			<div className={styles.HeroChartFadeBottom}></div>
			<div className={styles.HeroChartFadeBottomDeep}></div>
		</section>
	);
}
