import Link from '@docusaurus/Link';
import { useThemeConfig } from '@docusaurus/theme-common';
import useBaseUrl from '@docusaurus/useBaseUrl';
import React, { ComponentPropsWithoutRef } from 'react';

import styles from './index.module.css';

export interface LogoProps extends ComponentPropsWithoutRef<'a'> {
	readonly imageClassName?: string;
	readonly titleClassName?: string;
}

function Logo(props: LogoProps): JSX.Element {
	const { titleClassName, imageClassName, ...propsRest } = props;
	const {
		navbar: {
			logo = {
				src: '',
			},
		},
	} = useThemeConfig();
	const logoLink = useBaseUrl(logo.href || '/');

	return (
		<Link to={logoLink} {...propsRest}>
			<div className={styles.Logo} />
		</Link>
	);
}

export default Logo;
