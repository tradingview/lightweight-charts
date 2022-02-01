import React, { ComponentType, SVGProps } from "react";

const mobileMaxWidth = 767.4;

export function useIsMobileWidth() {
	const [isMobileWidth, setIsMobileWidth] = React.useState(innerWidth <= mobileMaxWidth);

	React.useEffect(() => {
		function handleResize() {
			setIsMobileWidth(window.innerWidth <= mobileMaxWidth);
		}

		window.addEventListener("resize", handleResize);

		handleResize();

		return () => window.removeEventListener("resize", handleResize);
	}, [mobileMaxWidth]);

	return isMobileWidth;
}

interface ResponsiveLogoProps {
	mobile: ComponentType<SVGProps<SVGSVGElement>>;
	desktopLaptopTablet: ComponentType<SVGProps<SVGSVGElement>>;
}

export function ResponsiveLogo(props: ResponsiveLogoProps) {
	const { mobile: Mobile, desktopLaptopTablet: DesktopLaptopTablet } = props;
	const isMobileWidth = useIsMobileWidth();

	return (
		isMobileWidth ? <Mobile /> : <DesktopLaptopTablet />
	)
}