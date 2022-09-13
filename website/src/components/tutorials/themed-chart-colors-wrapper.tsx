import { useColorMode } from '@docusaurus/theme-common';
import React, { useEffect, useState } from 'react';

import { themeColors } from '../../../theme-colors';

export interface ThemedChartColors {
	lineColor: string;
	backgroundColor: string;
	textColor: string;
	areaTopColor: string;
	areaBottomColor: string;
}

export interface ThemedChartProps {
	ChartComponent: React.ComponentType<{ colors: ThemedChartColors }>;
}

function getThemeColors(isDarkTheme: boolean): ThemedChartColors {
	const themeKey = isDarkTheme ? 'DARK' : 'LIGHT';

	return {
		backgroundColor: themeColors[themeKey].CHART_BACKGROUND_COLOR,
		lineColor: themeColors[themeKey].LINE_LINE_COLOR,
		textColor: themeColors[themeKey].CHART_TEXT_COLOR,
		areaTopColor: themeColors[themeKey].AREA_TOP_COLOR,
		areaBottomColor: themeColors[themeKey].AREA_BOTTOM_COLOR,
	};
}

export function useThemedChartColors(): ThemedChartColors {
	const { colorMode } = useColorMode();
	const isDarkTheme = colorMode === 'dark';
	const [colors, setColors] = useState<ThemedChartColors>(getThemeColors(isDarkTheme));

	useEffect(
		() => {
			setColors(getThemeColors(isDarkTheme));
		},
		[isDarkTheme]
	);

	return colors;
}

export function ThemedChart(props: ThemedChartProps): JSX.Element {
	const { ChartComponent } = props;
	const colors = useThemedChartColors();

	return <ChartComponent colors={colors} />;
}
