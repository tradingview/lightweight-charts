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
	return isDarkTheme
		? {
			backgroundColor: themeColors.DARK.CHART_BACKGROUND_COLOR,
			lineColor: themeColors.DARK.LINE_LINE_COLOR,
			textColor: themeColors.DARK.CHART_TEXT_COLOR,
			areaTopColor: themeColors.DARK.AREA_TOP_COLOR,
			areaBottomColor: themeColors.DARK.AREA_BOTTOM_COLOR,
		}
		: {
			backgroundColor: themeColors.LIGHT.CHART_BACKGROUND_COLOR,
			lineColor: themeColors.LIGHT.LINE_LINE_COLOR,
			textColor: themeColors.LIGHT.CHART_TEXT_COLOR,
			areaTopColor: themeColors.LIGHT.AREA_TOP_COLOR,
			areaBottomColor: themeColors.LIGHT.AREA_BOTTOM_COLOR,
		};
}

export function useThemedChartColors(): ThemedChartColors {
	const { isDarkTheme } = useColorMode();
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
