"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const color_1 = require("../../src/helpers/color");
(0, mocha_1.describe)('generateContrastColors', () => {
    (0, mocha_1.it)('should work', () => {
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgb(255, 255, 255)')).to.be.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgb(255, 255, 255)')).to.be.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(255, 255, 255, 0)')).to.be.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(255, 255, 255, 1)')).to.be.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgb(0, 0, 0)')).to.be.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgb(0, 0, 0)')).to.be.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(0, 0, 0, 0)')).to.be.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(0, 0, 0, 1)')).to.be.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
    });
    (0, mocha_1.it)('should correctly parse known named colors', () => {
        (0, chai_1.expect)((0, color_1.generateContrastColors)('aliceblue')).to.deep.equal({ foreground: 'black', background: 'rgb(240, 248, 255)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('coral')).to.deep.equal({ foreground: 'white', background: 'rgb(255, 127, 80)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('darkmagenta')).to.deep.equal({ foreground: 'white', background: 'rgb(139, 0, 139)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('linen')).to.deep.equal({ foreground: 'black', background: 'rgb(250, 240, 230)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('whitesmoke')).to.deep.equal({ foreground: 'black', background: 'rgb(245, 245, 245)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('white')).to.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('transparent')).to.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
    });
    (0, mocha_1.it)('should correctly parse short hex colors', () => {
        (0, chai_1.expect)((0, color_1.generateContrastColors)('#fff')).to.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('#000')).to.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('#fffa')).to.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
    });
    (0, mocha_1.it)('should correctly parse hex colors', () => {
        (0, chai_1.expect)((0, color_1.generateContrastColors)('#ffffff')).to.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('#ff0110')).to.deep.equal({ foreground: 'white', background: 'rgb(255, 1, 16)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('#f0f0f0aa')).to.deep.equal({ foreground: 'black', background: 'rgb(240, 240, 240)' });
    });
    (0, mocha_1.it)('should correctly parse RGB tuple string', () => {
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgb(10, 20, 30)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgb(0,0,0)')).to.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgb(	10	 , 	20 	, 	30  	)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        // RGB tuple may contain values exceeding 255, that should be clamped to 255 after parsing
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgb(256, 256, 256)')).to.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgb(100500, 100500, 100500)')).to.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgb(0, 100500, 0)')).to.deep.equal({ foreground: 'black', background: 'rgb(0, 255, 0)' });
        // RGB tuple may contain negative values, that should be clamped to zero after parsing
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgb(-10, -20, -30)')).to.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgb(10, -20, 30)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 0, 30)' });
        // whitespace characters before 'rgb', after 'rgb' and after the closing parenthesis are prohibited
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, '   	rgb(	10, 	20, 	30 		 )')).to.throw();
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgb	  (	10, 	20, 	30 		 )')).to.throw();
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgb(	10, 	20, 	30 		 ) 	  ')).to.throw();
        // RGB tuple should not contain non-integer values
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgb(10.0, 20, 30)')).to.throw();
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgb(10, 20.0, 30)')).to.throw();
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgb(10, 20, 30.0)')).to.throw();
        // not enough values in the tuple
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgb(10, 20)')).to.throw();
        // too much values in the tuple
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgb(10, 20, 30, 40)')).to.throw();
    });
    (0, mocha_1.it)('should correctly parse RGBA tuple string', () => {
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, 0.40)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(0,0,0,1)')).to.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(	10 	, 	20 	, 	30	, 	0.40   	)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, 0.1)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, .1)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, .001)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, .000000000001)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, .10001)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, .10005)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, .100000000005)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        // RGB components of a tuple may contain values exceeding 255, that should be clamped to 255 after parsing
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(256, 256, 256, 1.0)')).to.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(100500, 100500, 100500, 1.0)')).to.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(0, 100500, 0, 1.0)')).to.deep.equal({ foreground: 'black', background: 'rgb(0, 255, 0)' });
        // RGB components of a tuple may contain negative values, that should be clamped to zero after parsing
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(-10, -20, -30, 1.0)')).to.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, -20, 30, 1.0)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 0, 30)' });
        // Alpha component of a tuple may be a value exceeding 1.0, that should be clamped to 1.0 after parsing
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, 1.1)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, 1000.0)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, 1000000)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        // Alpha component of a tuple may be a negative value, that should be clamped to zero after parsing
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, -0.1)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, -1.1)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, -1000.0)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, -1000000)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        (0, chai_1.expect)((0, color_1.generateContrastColors)('rgba(10, 20, 30, -1000000.100000000005)')).to.deep.equal({ foreground: 'white', background: 'rgb(10, 20, 30)' });
        // dangling dot is prohibited
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgba(10, 20, 30, 1.)')).to.throw();
        // whitespace characters before 'rgba', after 'rgba' and after the closing parenthesis are prohibited
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, '   	rgba(	10, 	20, 	30	, 	0.40   	)')).to.throw();
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgba	  (	10, 	20, 	30	, 	0.40   	)')).to.throw();
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgba(	10, 	20, 	30	, 	0.40   	) 	  ')).to.throw();
        // RGB components of tuple should not contain non-integer values
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgba(10.0, 20, 30, 0)')).to.throw();
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgba(10, 20.0, 30, 0)')).to.throw();
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgba(10, 20, 30.0, 0)')).to.throw();
        // not enough values in the tuple
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgba(10, 20, 30)')).to.throw();
        // too much values in the tuple
        (0, chai_1.expect)(color_1.generateContrastColors.bind(null, 'rgba(10, 20, 30, 1.0, 1.0)')).to.throw();
    });
});
(0, mocha_1.describe)('gradientColorAtPercent', () => {
    (0, mocha_1.it)('0%', () => {
        (0, chai_1.expect)((0, color_1.gradientColorAtPercent)('rgb(255, 255, 255)', 'rgb(0, 0, 0)', 0)).to.be.equal('rgba(255, 255, 255, 1)');
        (0, chai_1.expect)((0, color_1.gradientColorAtPercent)('rgba(255, 255, 255, 1)', 'rgba(0, 0, 0, 0)', 0)).to.be.equal('rgba(255, 255, 255, 1)');
        (0, chai_1.expect)((0, color_1.gradientColorAtPercent)('#ffffff', '#000000', 0)).to.be.equal('rgba(255, 255, 255, 1)');
        (0, chai_1.expect)((0, color_1.gradientColorAtPercent)('#fff', '#000', 0)).to.be.equal('rgba(255, 255, 255, 1)');
    });
    (0, mocha_1.it)('50%', () => {
        (0, chai_1.expect)((0, color_1.gradientColorAtPercent)('rgb(255, 255, 255)', 'rgb(0, 0, 0)', 0.5)).to.be.equal('rgba(128, 128, 128, 1)');
        (0, chai_1.expect)((0, color_1.gradientColorAtPercent)('rgba(255, 255, 255, 1)', 'rgba(0, 0, 0, 0)', 0.5)).to.be.equal('rgba(128, 128, 128, 0.5)');
        (0, chai_1.expect)((0, color_1.gradientColorAtPercent)('#ffffff', '#000000', 0.5)).to.be.equal('rgba(128, 128, 128, 1)');
        (0, chai_1.expect)((0, color_1.gradientColorAtPercent)('#fff', '#000', 0.5)).to.be.equal('rgba(128, 128, 128, 1)');
    });
    (0, mocha_1.it)('100%', () => {
        (0, chai_1.expect)((0, color_1.gradientColorAtPercent)('rgb(255, 255, 255)', 'rgb(0, 0, 0)', 1)).to.be.equal('rgba(0, 0, 0, 1)');
        (0, chai_1.expect)((0, color_1.gradientColorAtPercent)('rgba(255, 255, 255, 1)', 'rgba(0, 0, 0, 0)', 1)).to.be.equal('rgba(0, 0, 0, 0)');
        (0, chai_1.expect)((0, color_1.gradientColorAtPercent)('#ffffff', '#000000', 1)).to.be.equal('rgba(0, 0, 0, 1)');
        (0, chai_1.expect)((0, color_1.gradientColorAtPercent)('#fff', '#000', 1)).to.be.equal('rgba(0, 0, 0, 1)');
    });
});
