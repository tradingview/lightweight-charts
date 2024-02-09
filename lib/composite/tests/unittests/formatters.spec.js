"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const date_formatter_1 = require("../../src/formatters/date-formatter");
const date_time_formatter_1 = require("../../src/formatters/date-time-formatter");
const percentage_formatter_1 = require("../../src/formatters/percentage-formatter");
const price_formatter_1 = require("../../src/formatters/price-formatter");
const time_formatter_1 = require("../../src/formatters/time-formatter");
const volume_formatter_1 = require("../../src/formatters/volume-formatter");
(0, mocha_1.describe)('Formatters', () => {
    (0, mocha_1.it)('date-formatter', () => {
        {
            const formatter = new date_formatter_1.DateFormatter();
            const d = new Date(1516147200000);
            const res = formatter.format(d);
            (0, chai_1.expect)(res).to.be.equal('2018-01-17');
        }
        {
            const formatter = new date_formatter_1.DateFormatter('dd-MM-yyyy');
            const d = new Date(1516147200000);
            const res = formatter.format(d);
            (0, chai_1.expect)(res).to.be.equal('17-01-2018');
        }
    });
    (0, mocha_1.it)('date-time-formatter', () => {
        const formatter = new date_time_formatter_1.DateTimeFormatter();
        const d = new Date(1538381512000);
        const res = formatter.format(d);
        (0, chai_1.expect)(res).to.be.equal('2018-10-01 08:11:52');
    });
    (0, mocha_1.it)('percent-formatter', () => {
        const formatter = new percentage_formatter_1.PercentageFormatter();
        const res = formatter.format(1.5);
        (0, chai_1.expect)(res).to.be.equal('1.50%');
    });
    (0, mocha_1.it)('price-formatter', () => {
        {
            const formatter = new price_formatter_1.PriceFormatter();
            const res = formatter.format(1.5);
            (0, chai_1.expect)(res).to.be.equal('1.50');
        }
        {
            const formatter = new price_formatter_1.PriceFormatter(1000);
            const res = formatter.format(1.5);
            (0, chai_1.expect)(res).to.be.equal('1.500');
        }
        {
            const formatter = new price_formatter_1.PriceFormatter(1000, 250);
            const res = formatter.format(1.6);
            (0, chai_1.expect)(res).to.be.equal('1.500');
        }
        {
            const formatter = new price_formatter_1.PriceFormatter();
            const res = formatter.format(-1.5);
            (0, chai_1.expect)(res).to.be.equal('\u22121.50');
        }
    });
    (0, mocha_1.it)('time-formatter', () => {
        {
            const formatter = new time_formatter_1.TimeFormatter();
            const d = new Date(1538381512000);
            const res = formatter.format(d);
            (0, chai_1.expect)(res).to.be.equal('08:11:52');
        }
        {
            const formatter = new time_formatter_1.TimeFormatter('%h-%m-%s');
            const d = new Date(1538381512000);
            const res = formatter.format(d);
            (0, chai_1.expect)(res).to.be.equal('08-11-52');
        }
    });
    (0, mocha_1.it)('volume-formatter', () => {
        const formatter = new volume_formatter_1.VolumeFormatter(3);
        (0, chai_1.expect)(formatter.format(1)).to.be.equal('1');
        (0, chai_1.expect)(formatter.format(10)).to.be.equal('10');
        (0, chai_1.expect)(formatter.format(100)).to.be.equal('100');
        (0, chai_1.expect)(formatter.format(1000)).to.be.equal('1K');
        (0, chai_1.expect)(formatter.format(5500)).to.be.equal('5.5K');
        (0, chai_1.expect)(formatter.format(1155000)).to.be.equal('1.155M');
    });
});
