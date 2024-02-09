"use strict";
/// <reference types="node" />
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const puppeteer_1 = tslib_1.__importDefault(require("puppeteer"));
const perform_interactions_1 = require("../helpers/perform-interactions");
const get_interaction_test_cases_1 = require("./helpers/get-interaction-test-cases");
const dummyContent = fs.readFileSync(path.join(__dirname, 'helpers', 'test-page-dummy.html'), { encoding: 'utf-8' });
function generatePageContent(standaloneBundlePath, testCaseCode) {
    return dummyContent
        .replace('PATH_TO_STANDALONE_MODULE', standaloneBundlePath)
        .replace('TEST_CASE_SCRIPT', testCaseCode);
}
const testStandalonePathEnvKey = 'TEST_STANDALONE_PATH';
const testStandalonePath = process.env[testStandalonePathEnvKey] || '';
(0, mocha_1.describe)('Interactions tests', function () {
    // this tests are unstable sometimes.
    this.retries(5);
    const puppeteerOptions = {};
    if (process.env.NO_SANDBOX) {
        puppeteerOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
    }
    let browser;
    before(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        (0, chai_1.expect)(testStandalonePath, `path to test standalone module must be passed via ${testStandalonePathEnvKey} env var`).to.have.length.greaterThan(0);
        // note that we cannot use launchPuppeteer here as soon it wrong typing in puppeteer
        // see https://github.com/puppeteer/puppeteer/issues/7529
        const browserPromise = puppeteer_1.default.launch(puppeteerOptions);
        browser = yield browserPromise;
    }));
    let testCaseCount = 0;
    const runTestCase = (testCase) => {
        testCaseCount += 1;
        (0, mocha_1.it)(testCase.name, () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const pageContent = generatePageContent(testStandalonePath, testCase.caseContent);
            const page = yield browser.newPage();
            yield page.setViewport({ width: 600, height: 600 });
            const errors = [];
            page.on('pageerror', (error) => {
                errors.push(error.message);
            });
            page.on('response', (response) => {
                if (!response.ok()) {
                    errors.push(`Network error: ${response.url()} status=${response.status()}`);
                }
            });
            yield page.setContent(pageContent, { waitUntil: 'load' });
            yield page.evaluate(() => {
                return window.finishedSetup;
            });
            const initialInteractionsToPerform = yield page.evaluate(() => {
                if (!window.initialInteractionsToPerform) {
                    return [];
                }
                return window.initialInteractionsToPerform();
            });
            yield (0, perform_interactions_1.performInteractions)(page, initialInteractionsToPerform);
            yield page.evaluate(() => {
                var _a, _b;
                if (window.afterInitialInteractions) {
                    return (_b = (_a = window).afterInitialInteractions) === null || _b === void 0 ? void 0 : _b.call(_a);
                }
                return new Promise((resolve) => {
                    window.requestAnimationFrame(() => {
                        setTimeout(resolve, 50);
                    });
                });
            });
            const finalInteractionsToPerform = yield page.evaluate(() => {
                if (!window.finalInteractionsToPerform) {
                    return [];
                }
                return window.finalInteractionsToPerform();
            });
            if (finalInteractionsToPerform && finalInteractionsToPerform.length > 0) {
                yield (0, perform_interactions_1.performInteractions)(page, finalInteractionsToPerform);
            }
            yield page.evaluate(() => {
                return new Promise((resolve) => {
                    window.afterFinalInteractions();
                    window.requestAnimationFrame(() => {
                        setTimeout(resolve, 50);
                    });
                });
            });
            yield page.close();
            if (errors.length !== 0) {
                throw new Error(`Page has errors:\n${errors.join('\n')}`);
            }
            (0, chai_1.expect)(errors.length).to.be.equal(0, 'There should not be any errors thrown within the test page.');
        }));
    };
    const testCaseGroups = (0, get_interaction_test_cases_1.getTestCases)();
    for (const groupName of Object.keys(testCaseGroups)) {
        if (groupName.length === 0) {
            for (const testCase of testCaseGroups[groupName]) {
                runTestCase(testCase);
            }
        }
        else {
            (0, mocha_1.describe)(groupName, () => {
                for (const testCase of testCaseGroups[groupName]) {
                    runTestCase(testCase);
                }
            });
        }
    }
    (0, mocha_1.it)('number of test cases', () => {
        // we need to have at least 1 test to check it
        (0, chai_1.expect)(testCaseCount).to.be.greaterThan(0, 'there should be at least 1 test case');
    });
    after(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield browser.close();
    }));
});
