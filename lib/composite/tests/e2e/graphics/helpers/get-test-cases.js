"use strict";
/// <reference types="node" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestCases = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const testCasesDir = path.join(__dirname, '..', 'test-cases');
function extractTestCaseName(fileName) {
    const match = /^([^.].+)\.js$/.exec(path.basename(fileName));
    return match && match[1];
}
function isTestCaseFile(filePath) {
    return fs.lstatSync(filePath).isFile() && extractTestCaseName(filePath) !== null;
}
function getTestCaseGroups() {
    return [
        {
            name: '',
            path: testCasesDir,
        },
        ...fs.readdirSync(testCasesDir)
            .filter((filePath) => fs.lstatSync(path.join(testCasesDir, filePath)).isDirectory())
            .map((filePath) => {
            return {
                name: filePath,
                path: path.join(testCasesDir, filePath),
            };
        }),
    ];
}
function getTestCases() {
    const result = {};
    for (const group of getTestCaseGroups()) {
        result[group.name] = fs.readdirSync(group.path)
            .map((filePath) => path.join(group.path, filePath))
            .filter(isTestCaseFile)
            .map((testCaseFile) => {
            return {
                name: extractTestCaseName(testCaseFile),
                caseContent: fs.readFileSync(testCaseFile, { encoding: 'utf-8' }),
            };
        });
    }
    return result;
}
exports.getTestCases = getTestCases;
