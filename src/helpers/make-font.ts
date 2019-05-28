/**
 * Default font family.
 * Must be used to generate font string when font is not specified.
 */
export const defaultFontFamily = `'Trebuchet MS', Roboto, Ubuntu, sans-serif`;

/**
 * Generates a font string, which can be used to set in canvas' font property.
 * If no family provided, [defaultFontFamily] will be used.
 */
export function makeFont(size: number, family?: string, style?: string): string {
	if (style !== undefined) {
		style = `${style} `;
	} else {
		style = '';
	}

	if (family === undefined) {
		family = defaultFontFamily;
	}

	return `${style}${size}px ${family}`;
}
