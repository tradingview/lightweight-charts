"use strict";
/// <reference types="node" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestCases = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const testCasesDir = path.join(__dirname, '..', 'test-cases');
function extractTestCaseName(fileName) {
    const match = /^([^.].+)\.js$/.exec(fileName);
    return match && match[1];
}
function isTestCaseFile(filePath) {
    return fs.lstatSync(path.join(testCasesDir, filePath)).isFile() && extractTestCaseName(filePath) !== null;
}
function getTestCases() {
    return fs.readdirSync(testCasesDir)
        .filter(isTestCaseFile)
        .map((testCaseFile) => ({
        name: extractTestCaseName(testCaseFile),
        path: path.join(testCasesDir, testCaseFile),
    }));
}
exports.getTestCases = getTestCases;
