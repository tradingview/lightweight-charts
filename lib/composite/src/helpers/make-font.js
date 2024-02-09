"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFont = exports.defaultFontFamily = void 0;
/**
 * Default font family.
 * Must be used to generate font string when font is not specified.
 */
exports.defaultFontFamily = `-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif`;
/**
 * Generates a font string, which can be used to set in canvas' font property.
 * If no family provided, {@link defaultFontFamily} will be used.
 *
 * @param size - Font size in pixels.
 * @param family - Optional font family.
 * @param style - Optional font style.
 * @returns The font string.
 */
function makeFont(size, family, style) {
    if (style !== undefined) {
        style = `${style} `;
    }
    else {
        style = '';
    }
    if (family === undefined) {
        family = exports.defaultFontFamily;
    }
    return `${style}${size}px ${family}`;
}
exports.makeFont = makeFont;
