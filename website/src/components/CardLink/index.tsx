import Link from '@docusaurus/Link';
import clsx from 'clsx';
import React, { type ReactNode } from 'react';

import styles from './styles.module.css';

function CardContainer({
	href,
	children,
}: {
	href: string;
	children: ReactNode;
}): React.JSX.Element {
	return (
		<Link
			href={href}
			className={clsx('card padding--lg', styles.cardContainer)}
		>
			{children}
		</Link>
	);
}

function CardLayout({
	href,
	icon,
	title,
	description,
	image,
	wrapDescription = false,
}: {
	href: string;
	title: string;
	description?: string;
	image?: ReactNode;
	icon?: ReactNode;
	wrapDescription: boolean;
}): React.JSX.Element {
	return (
		<CardContainer href={href}>
			{image && <div className={clsx(styles.cardImage)}>{image}</div>}
			<div className={clsx(styles.cardDetails, wrapDescription && styles.centerDetails)}>
				<h2 className={clsx(wrapDescription && styles.noBottomMargin, 'text--truncate', styles.cardTitle)} title={title}>
					{icon} {title}
				</h2>
				{description && (
					<p
						className={clsx(wrapDescription ? styles.noWrap : 'text--truncate', styles.cardDescription)}
						title={description}
					>
						{description}
					</p>
				)}
			</div>
		</CardContainer>
	);
}

export interface CardLinkItem {
	href: string;
	title: string;
	icon?: string;
	image?: ReactNode;
	description?: string;
}

export default function CardLink({
	item,
	frontPage = false,
}: {
	item: CardLinkItem;
	frontPage: boolean;
}): React.JSX.Element {
	return (
		<CardLayout
			href={item.href}
			icon={item.icon}
			title={item.title}
			description={item.description}
			image={item.image}
			wrapDescription={frontPage}
		/>
	);
}
