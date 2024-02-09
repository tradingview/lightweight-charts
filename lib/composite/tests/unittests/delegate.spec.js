"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const delegate_1 = require("../../src/helpers/delegate");
(0, mocha_1.describe)('Delegate', () => {
    (0, mocha_1.it)('unsubscribeAll', () => {
        const linkedObjectOne = {};
        const linkedObjectTwo = {};
        const eventDelegate = new delegate_1.Delegate();
        eventDelegate.subscribe(() => { }, linkedObjectOne);
        (0, chai_1.expect)(eventDelegate.hasListeners()).to.be.equal(true);
        eventDelegate.unsubscribeAll(linkedObjectTwo);
        (0, chai_1.expect)(eventDelegate.hasListeners()).to.be.equal(true);
        eventDelegate.unsubscribeAll(linkedObjectOne);
        (0, chai_1.expect)(eventDelegate.hasListeners()).to.be.equal(false);
    });
});
