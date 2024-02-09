"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.watermarkOptionsDefaults = void 0;
const make_font_1 = require("../../helpers/make-font");
exports.watermarkOptionsDefaults = {
    color: 'rgba(0, 0, 0, 0)',
    visible: false,
    fontSize: 48,
    fontFamily: make_font_1.defaultFontFamily,
    fontStyle: '',
    text: '',
    horzAlign: 'center',
    vertAlign: 'center',
};
