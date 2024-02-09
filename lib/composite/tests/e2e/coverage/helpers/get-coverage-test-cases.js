"use strict";
/// <reference types="node" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestCases = void 0;
const tslib_1 = require("tslib");
const path = tslib_1.__importStar(require("path"));
const get_test_cases_1 = require("../../helpers/get-test-cases");
const testCasesDir = path.join(__dirname, '..', 'test-cases');
function getTestCases() {
    return (0, get_test_cases_1.getTestCases)(testCasesDir);
}
exports.getTestCases = getTestCases;
