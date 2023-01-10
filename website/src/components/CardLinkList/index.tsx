import clsx from 'clsx';
import React from 'react';

import { default as CardLink, type CardLinkItem } from '../CardLink';

interface Props {
	className: string;
	items: CardLinkItem[];
}

export default function DocCardList({ items, className }: Props): JSX.Element {
	return (
     <section className={clsx('row', className)}>
       {items.map((item: CardLinkItem, index: number) => (
         <article key={index} className="col col--6 margin-bottom--lg">
           <CardLink item={item} />
         </article>
       ))}
     </section>
	);
}

