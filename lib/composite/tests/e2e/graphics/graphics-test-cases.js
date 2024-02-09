"use strict";
/// <reference types="node" />
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const pngjs_1 = require("pngjs");
const compare_screenshots_1 = require("./helpers/compare-screenshots");
const get_test_cases_1 = require("./helpers/get-test-cases");
const screenshoter_1 = require("./helpers/screenshoter");
const dummyContent = fs.readFileSync(path.join(__dirname, 'helpers', 'test-page-dummy.html'), { encoding: 'utf-8' });
const buildMode = process.env.PRODUCTION_BUILD === 'true' ? 'production' : 'development';
function generatePageContent(standaloneBundlePath, testCaseCode) {
    return dummyContent
        .replace('PATH_TO_STANDALONE_MODULE', standaloneBundlePath)
        .replace('TEST_CASE_SCRIPT', testCaseCode)
        .replace('{BUILD_MODE}', buildMode);
}
const goldenStandalonePathEnvKey = 'GOLDEN_STANDALONE_PATH';
const testStandalonePathEnvKey = 'TEST_STANDALONE_PATH';
let devicePixelRatio = process.env.DEVICE_PIXEL_RATIO ? parseFloat(process.env.DEVICE_PIXEL_RATIO) : 1;
if (isNaN(devicePixelRatio)) {
    devicePixelRatio = 1;
}
const devicePixelRatioStr = devicePixelRatio.toFixed(2);
const testResultsOutDir = path.resolve(process.env.CMP_OUT_DIR || path.join(__dirname, '.gendata'));
const goldenStandalonePath = process.env[goldenStandalonePathEnvKey] || '';
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
function removeEmptyDirsRecursive(rootDir) {
    if (!fs.existsSync(rootDir)) {
        return;
    }
    fs.readdirSync(rootDir).forEach((file) => {
        const filePath = path.join(rootDir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            removeEmptyDirsRecursive(filePath);
        }
    });
    if (fs.readdirSync(rootDir).length === 0) {
        fs.rmdirSync(rootDir);
    }
}
(0, mocha_1.describe)(`Graphics tests with devicePixelRatio=${devicePixelRatioStr} (${buildMode} mode)`, function () {
    // this tests are unstable sometimes :(
    this.retries(5);
    const testCases = (0, get_test_cases_1.getTestCases)();
    before(() => {
        rmRf(testResultsOutDir);
        fs.mkdirSync(testResultsOutDir, { recursive: true });
        (0, chai_1.expect)(goldenStandalonePath, `path to golden standalone module must be passed via ${goldenStandalonePathEnvKey} env var`)
            .to.have.length.greaterThan(0);
        (0, chai_1.expect)(testStandalonePath, `path to golden standalone module must be passed via ${testStandalonePathEnvKey} env var`)
            .to.have.length.greaterThan(0);
    });
    const screenshoter = new screenshoter_1.Screenshoter(Boolean(process.env.NO_SANDBOX), devicePixelRatio);
    const currentDprOutDir = path.join(testResultsOutDir, `devicePixelRatio=${devicePixelRatioStr}`);
    for (const groupName of Object.keys(testCases)) {
        const currentGroupOutDir = path.join(currentDprOutDir, groupName);
        if (groupName.length === 0) {
            registerTestCases(testCases[groupName], screenshoter, currentGroupOutDir);
        }
        else {
            (0, mocha_1.describe)(groupName, () => {
                registerTestCases(testCases[groupName], screenshoter, currentGroupOutDir);
            });
        }
    }
    (0, mocha_1.after)(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield screenshoter.close();
        removeEmptyDirsRecursive(testResultsOutDir);
    }));
});
function registerTestCases(testCases, screenshoter, outDir) {
    const attempts = {};
    testCases.forEach((testCase) => {
        attempts[testCase.name] = 0;
    });
    for (const testCase of testCases) {
        (0, mocha_1.it)(testCase.name, () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const previousAttempts = attempts[testCase.name];
            attempts[testCase.name] += 1;
            const testCaseOutDir = path.join(outDir, testCase.name);
            rmRf(testCaseOutDir);
            fs.mkdirSync(testCaseOutDir, { recursive: true });
            function writeTestDataItem(fileName, fileContent) {
                fs.writeFileSync(path.join(testCaseOutDir, fileName), fileContent);
            }
            const goldenPageContent = generatePageContent(goldenStandalonePath, testCase.caseContent);
            const testPageContent = generatePageContent(testStandalonePath, testCase.caseContent);
            writeTestDataItem('1.golden.html', goldenPageContent);
            writeTestDataItem('2.test.html', testPageContent);
            const errors = [];
            const failedPages = [];
            // run in parallel to increase speed
            const goldenScreenshotPromise = screenshoter.generateScreenshot(goldenPageContent);
            if (previousAttempts) {
                try {
                    // If a test has previously failed then attempt to run the tests in series (one at a time).
                    yield goldenScreenshotPromise;
                }
                catch (_a) {
                    // error will be caught again below and handled correctly there.
                }
            }
            const testScreenshotPromise = screenshoter.generateScreenshot(testPageContent);
            let goldenScreenshot = null;
            try {
                goldenScreenshot = yield goldenScreenshotPromise;
                writeTestDataItem('1.golden.png', pngjs_1.PNG.sync.write(goldenScreenshot));
            }
            catch (e) {
                errors.push(`=== Golden page ===\n${e.message}`);
                failedPages.push('golden');
            }
            let testScreenshot = null;
            try {
                testScreenshot = yield testScreenshotPromise;
                writeTestDataItem('2.test.png', pngjs_1.PNG.sync.write(testScreenshot));
            }
            catch (e) {
                errors.push(`=== Test page ===\n${e.message}`);
                failedPages.push('test');
            }
            if (goldenScreenshot !== null && testScreenshot !== null) {
                const compareResult = (0, compare_screenshots_1.compareScreenshots)(goldenScreenshot, testScreenshot);
                writeTestDataItem('3.diff.png', pngjs_1.PNG.sync.write(compareResult.diffImg));
                (0, chai_1.expect)(compareResult.diffPixelsCount).to.be.equal(0, 'number of different pixels must be 0');
            }
            else {
                writeTestDataItem('3.errors.txt', errors.join('\n\n'));
                throw new Error(`The error(s) happened while generating a screenshot for the page(s): ${failedPages.join(', ')}.
See ${testCaseOutDir} directory for an output of the test case.`);
            }
            rmRf(testCaseOutDir);
        }));
    }
}
