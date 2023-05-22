import React from 'react';

import styles from './banner.module.css';

export default function Banner(props: {
	text: string;
	link: string;
	linkText: string;
}): React.JSX.Element {
	return (
		<a className={styles.Banner} href={props.link}>
			<div className={styles.BannerContent}>{props.text}</div>
			<div className={styles.BannerButton}>{props.linkText}</div>
		</a>
	);
}
