import Link from '@docusaurus/Link';
import { useThemeConfig } from '@docusaurus/theme-common';
import useBaseUrl from '@docusaurus/useBaseUrl';
import React, { ComponentPropsWithoutRef } from 'react';

import NavbarLogoDesktopLaptopTablet from '../../img/navbar-logo-desktop-laptop-tablet.svg';
import NavbarLogoMobile from '../../img/navbar-logo-mobile.svg';
import { ResponsiveLogo } from '../../responsive-logo';

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
			<ResponsiveLogo mobile={NavbarLogoMobile} desktopLaptopTablet={NavbarLogoDesktopLaptopTablet} />
		</Link>
	);
}

export default Logo;
