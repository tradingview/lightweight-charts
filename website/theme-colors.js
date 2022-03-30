const greenWithAlpha = alpha => `rgba(15, 216, 62, ${alpha})`;
const redWithAlpha = alpha => `rgb(255, 64, 64, ${alpha})`;
const blueWithAlpha = alpha => `rgba(41, 98, 255, ${alpha})`;

export const themeColors = {
	DARK: {
		CHART_BACKGROUND_COLOR: 'black',
		LINE_LINE_COLOR: blueWithAlpha(0.9),
		AREA_TOP_COLOR: blueWithAlpha(0.5),
		AREA_BOTTOM_COLOR: blueWithAlpha(0.2),
		BAR_UP_COLOR: greenWithAlpha(1),
		BAR_DOWN_COLOR: redWithAlpha(1),
		BASELINE_TOP_LINE_COLOR: greenWithAlpha(1),
		BASELINE_TOP_FILL_COLOR1: greenWithAlpha(0.9),
		BASELINE_TOP_FILL_COLOR2: greenWithAlpha(0.1),
		BASELINE_BOTTOM_LINE_COLOR: redWithAlpha(1),
		BASELINE_BOTTOM_FILL_COLOR1: redWithAlpha(0.1),
		BASELINE_BOTTOM_FILL_COLOR2: redWithAlpha(0.9),
		HISTOGRAM_COLOR: greenWithAlpha(1),
		CHART_TEXT_COLOR: 'white',
	},

	LIGHT: {
		CHART_BACKGROUND_COLOR: 'white',
		LINE_LINE_COLOR: blueWithAlpha(0.9),
		AREA_TOP_COLOR: blueWithAlpha(0.5),
		AREA_BOTTOM_COLOR: blueWithAlpha(0.05),
		BAR_UP_COLOR: greenWithAlpha(1),
		BAR_DOWN_COLOR: redWithAlpha(1),
		BASELINE_TOP_LINE_COLOR: greenWithAlpha(0.5),
		BASELINE_TOP_FILL_COLOR1: greenWithAlpha(0.4),
		BASELINE_TOP_FILL_COLOR2: greenWithAlpha(0),
		BASELINE_BOTTOM_LINE_COLOR: redWithAlpha(1),
		BASELINE_BOTTOM_FILL_COLOR1: redWithAlpha(0),
		BASELINE_BOTTOM_FILL_COLOR2: redWithAlpha(0.9),
		HISTOGRAM_COLOR: greenWithAlpha(1),
		CHART_TEXT_COLOR: 'black',
	},
};
