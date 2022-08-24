import clsx from 'clsx';
import React, { type ReactNode } from 'react';

import styles from './styles.module.css';

export interface Props {
	children: ReactNode;
}

/*
 * Simple Details Component which is not animated.
 * Default Docusaurus implementation of `details` element includes
 * an animation with a duration based on the revealed contents height.
 * This results in a very long animation if revealing a lot of content
 * such as a code block.
 */
export default function InstantDetails({ children }: Props): JSX.Element {
	return <details className={clsx(styles.details)}>{children}</details>;
}
