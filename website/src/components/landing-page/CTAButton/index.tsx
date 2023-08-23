import React from 'react';

import styles from './ctabutton.module.css';

export interface CTALink {
	title: string;
	link: string;
	primary?: boolean;
	external?: boolean;
}

function ExternalLinkSVG(): React.JSX.Element {
	return (
		<svg
			width="28"
			height="28"
			viewBox="0 0 28 28"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M7.5 8.75C7.5 8.05964 8.05964 7.5 8.75 7.5H12V6H8.75C7.23122 6 6 7.23122 6 8.75V19.25C6 20.7688 7.23122 22 8.75 22H19.25C20.7688 22 22 20.7688 22 19.25V16H20.5V19.25C20.5 19.9404 19.9404 20.5 19.25 20.5H8.75C8.05964 20.5 7.5 19.9404 7.5 19.25V8.75ZM14.9993 7.5H19.4387L12.6455 14.2932L13.7061 15.3539L20.4993 8.56066V13.045H21.9993V6.75V6H21.2493H14.9993V7.5Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export default function CTAButton(link: CTALink): React.JSX.Element {
	return (
		<a
			className={styles.SquareButton}
			href={link.link}
			data-primary={link.primary}
		>
			<span>{link.title}</span>
			{link.external ? <ExternalLinkSVG /> : ''}
		</a>
	);
}
