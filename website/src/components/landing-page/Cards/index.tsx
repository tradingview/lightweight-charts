import React from 'react';

import styles from './cards.module.css';

export interface CardLink {
	title: string;
	link: string;
	content: string;
}

function ArrowSVG(): React.JSX.Element {
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

function Card(cardData: CardLink): React.JSX.Element {
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

export default function Cards(props: { cardLinks: CardLink[] }): React.JSX.Element {
	const cards = props.cardLinks.map((cardData: CardLink) => (
		<Card key={cardData.title} {...cardData} />
	));
	return <section className={styles.CardsContainer}>{cards}</section>;
}
