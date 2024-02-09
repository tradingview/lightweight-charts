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
const coverage_config_1 = require("./coverage-config");
const get_coverage_test_cases_1 = require("./helpers/get-coverage-test-cases");
const dummyContent = fs.readFileSync(path.join(__dirname, 'helpers', 'test-page-dummy.html'), { encoding: 'utf-8' });
function generatePageContent(standaloneBundlePath, testCaseCode) {
    return dummyContent
        .replace('PATH_TO_STANDALONE_MODULE', standaloneBundlePath)
        .replace('TEST_CASE_SCRIPT', testCaseCode);
}
const testStandalonePathEnvKey = 'TEST_STANDALONE_PATH';
const testStandalonePath = process.env[testStandalonePathEnvKey] || '';
function rmRf(dir) {
    if (!fs.existsSync(dir)) {
        return;
    }
    fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            rmRf(filePath);
        }
        else {
            fs.unlinkSync(filePath);
        }
    });
    fs.rmdirSync(dir);
}
function generateAndSaveCoverageFile(coveredJs) {
    // Create output directory
    const outDir = path.resolve(process.env.CMP_OUT_DIR || path.join(__dirname, '.gendata'));
    rmRf(outDir);
    fs.mkdirSync(outDir, { recursive: true });
    try {
        const filePath = path.join(outDir, 'covered.js');
        fs.writeFileSync(filePath, coveredJs);
        console.info('\nGenerated `covered.js` file for the coverage test.\n');
        console.info(filePath);
    }
    catch (error) {
        console.warn('Unable to save `covered.js` file for the coverage test.');
        console.error(error);
    }
}
function getCoverageResult(page) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const coverageEntries = yield page.coverage.stopJSCoverage();
        const getFileNameFromUrl = (url) => { var _a; return (_a = url.split('/').at(-1)) !== null && _a !== void 0 ? _a : ''; };
        for (const entry of coverageEntries) {
            const fileName = getFileNameFromUrl(entry.url);
            if (fileName === 'test.js') {
                return entry;
            }
        }
        return null;
    });
}
function mergeRanges(ranges) {
    ranges.sort((a, b) => {
        if (a.start === b.start) {
            return a.end - b.end;
        }
        return a.start - b.start;
    });
    const merged = [];
    for (const range of ranges) {
        const last = merged.at(-1);
        if (!last || last.end < range.start) {
            merged.push(range);
        }
        else {
            last.end = Math.max(last.end, range.end);
        }
    }
    return merged;
}
function consolidateCoverageResults(testResults) {
    const coveredRanges = [];
    let testScriptCode = '';
    for (const [, coverageResult] of Object.entries(testResults)) {
        coveredRanges.push(...coverageResult.ranges);
        if (!testScriptCode) {
            // Every test is against the same library file,
            // therefore this will be the same for each coverageResult
            testScriptCode = coverageResult.text;
        }
    }
    const totalBytes = testScriptCode.length;
    const mergedRanges = mergeRanges(coveredRanges);
    let usedBytes = 0;
    let coverageFile = '';
    for (const range of mergedRanges) {
        usedBytes += (range.end - range.start);
        coverageFile += testScriptCode.slice(range.start, range.end) + '\n';
    }
    return {
        usedBytes,
        totalBytes,
        coverageFile,
    };
}
(0, mocha_1.describe)('Coverage tests', () => {
    const puppeteerOptions = {};
    if (process.env.NO_SANDBOX) {
        puppeteerOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
    }
    let browser;
    before(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        (0, chai_1.expect)(testStandalonePath, `path to test standalone module must be passed via ${testStandalonePathEnvKey} env var`).to.have.length.greaterThan(0);
        // note that we cannot use launchPuppeteer here as soon it wrong typing in puppeteer
        // see https://github.com/puppeteer/puppeteer/issues/7529
        const browserPromise = puppeteer_1.default.launch(puppeteerOptions);
        browser = yield browserPromise;
    }));
    let testCaseCount = 0;
    const coverageResults = {};
    const runTestCase = (testCase) => {
        testCaseCount += 1;
        (0, mocha_1.it)(testCase.name, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const pageContent = generatePageContent(testStandalonePath, testCase.caseContent);
            const page = yield browser.newPage();
            yield page.coverage.startJSCoverage();
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
            const interactionsToPerform = yield page.evaluate(() => {
                return window.interactions;
            });
            yield (0, perform_interactions_1.performInteractions)(page, interactionsToPerform);
            yield page.evaluate(() => {
                return new Promise((resolve) => {
                    window.afterInteractions();
                    window.requestAnimationFrame(() => {
                        setTimeout(resolve, 50);
                    });
                });
            });
            if (errors.length !== 0) {
                throw new Error(`Page has errors:\n${errors.join('\n')}`);
            }
            (0, chai_1.expect)(errors.length).to.be.equal(0, 'There should not be any errors thrown within the test page.');
            const result = yield getCoverageResult(page);
            (0, chai_1.expect)(result).not.to.be.equal(null);
            if (result) {
                coverageResults[testCase.name] = result;
            }
        }));
    };
    const testCaseGroups = (0, get_coverage_test_cases_1.getTestCases)();
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
    after(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield browser.close();
        const consolidatedResult = consolidateCoverageResults(coverageResults);
        (0, chai_1.expect)(consolidatedResult.usedBytes).to.be.lessThanOrEqual(consolidatedResult.totalBytes, 'Used bytes should be less than or equal to Total bytes.');
        (0, chai_1.expect)(consolidatedResult.usedBytes).to.be.greaterThan(0, 'Used bytes should be more than zero.');
        if (process.env.GENERATE_COVERAGE_FILE === 'true') {
            generateAndSaveCoverageFile(consolidatedResult.coverageFile);
        }
        const currentCoverage = parseFloat(((consolidatedResult.usedBytes / consolidatedResult.totalBytes) * 100).toFixed(2));
        (0, chai_1.expect)(currentCoverage).to.be.closeTo(coverage_config_1.expectedCoverage, coverage_config_1.threshold, `Please either update config to pass the test or improve coverage`);
        console.log(`Current coverage is ${currentCoverage.toFixed(2)}% (${formatChange(currentCoverage - coverage_config_1.expectedCoverage)}%)`);
    }));
});
function formatChange(change) {
    return change < 0 ? change.toFixed(1) : `+${change.toFixed(1)}`;
}
