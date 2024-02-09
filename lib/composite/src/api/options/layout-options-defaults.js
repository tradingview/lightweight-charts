"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layoutOptionsDefaults = void 0;
const make_font_1 = require("../../helpers/make-font");
exports.layoutOptionsDefaults = {
    background: {
        type: "solid" /* ColorType.Solid */,
        color: '#FFFFFF',
    },
    textColor: '#191919',
    fontSize: 12,
    fontFamily: make_font_1.defaultFontFamily,
};
