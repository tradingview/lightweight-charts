"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const format_date_1 = require("../../src/formatters/format-date");
(0, mocha_1.describe)('formatDate', () => {
    const date = new Date('1990-04-24');
    const locale = 'en-US';
    (0, mocha_1.it)('should correct handle yyyy sequence', () => {
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'yyyy', locale)).to.be.equal('1990');
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'yyyy yyyy', locale)).to.be.equal('1990 1990');
    });
    (0, mocha_1.it)('should correct handle yy sequence', () => {
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'yy', locale)).to.be.equal('90');
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'yy yy', locale)).to.be.equal('90 90');
    });
    (0, mocha_1.it)('should correct handle yyyy and yy sequences', () => {
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'yyyy yy', locale)).to.be.equal('1990 90');
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'yy yyyy', locale)).to.be.equal('90 1990');
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'yy yyyy yy yyyy yyyy yy', locale)).to.be.equal('90 1990 90 1990 1990 90');
    });
    (0, mocha_1.it)('should correct handle MMMM sequence', () => {
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'MMMM', locale)).to.be.equal('April');
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'MMMM MMMM', locale)).to.be.equal('April April');
    });
    (0, mocha_1.it)('should correct handle MMM sequence', () => {
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'MMM', locale)).to.be.equal('Apr');
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'MMM MMM', locale)).to.be.equal('Apr Apr');
    });
    (0, mocha_1.it)('should correct handle MM sequence', () => {
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'MM', locale)).to.be.equal('04');
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'MM MM', locale)).to.be.equal('04 04');
    });
    (0, mocha_1.it)('should correct handle MMMM, MMM and MM sequences', () => {
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'MMMM MMM MM', locale)).to.be.equal('April Apr 04');
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'MMMM MMM MM MM MMM MMMM', locale)).to.be.equal('April Apr 04 04 Apr April');
    });
    (0, mocha_1.it)('should correct handle dd sequence', () => {
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'dd', locale)).to.be.equal('24');
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'dd dd', locale)).to.be.equal('24 24');
    });
    (0, mocha_1.it)('should ignore non-sequences', () => {
        (0, chai_1.expect)((0, format_date_1.formatDate)(date, 'My custom format for date is yyyy-yy-MMMM-MM-MMM dd!', locale)).to.be.equal('My custom format for date is 1990-90-April-04-Apr 24!');
    });
});
