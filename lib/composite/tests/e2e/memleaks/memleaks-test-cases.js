"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const api_1 = require("@memlab/api");
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const get_all_class_names_1 = require("./helpers/get-all-class-names");
const get_test_cases_1 = require("./helpers/get-test-cases");
const serverAddressVarName = 'SERVER_ADDRESS';
const serverURL = process.env[serverAddressVarName] || '';
(0, mocha_1.describe)('Memleaks tests', function () {
    // this tests are unstable sometimes.
    this.retries(0);
    const testCases = (0, get_test_cases_1.getTestCases)();
    (0, mocha_1.it)('number of test cases', () => {
        // we need to have at least 1 test to check it
        (0, chai_1.expect)(testCases.length).to.be.greaterThan(0, 'there should be at least 1 test case');
    });
    const classNames = new Set();
    for (const testCase of testCases) {
        (0, mocha_1.it)(testCase.name, () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _a;
            var _b;
            console.log(`\n\tRunning test: ${testCase.name}`);
            if (classNames.size < 1) {
                // async function that we will only call if we don't already have values
                const names = yield (0, get_all_class_names_1.getClassNames)();
                for (const name of names) {
                    classNames.add(name);
                }
            }
            (0, chai_1.expect)(classNames.size).to.be.greaterThan(0, 'Class name list should contain items');
            const test = yield (_a = testCase.path, Promise.resolve().then(() => tslib_1.__importStar(require(_a))));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const scenario = test.scenario;
            const expectToFail = scenario.expectFail === true;
            const allowedLeaks = (_b = scenario.allowedLeaks) !== null && _b !== void 0 ? _b : [];
            if (expectToFail) {
                console.log(`\t!! This test is expected to fail.`);
            }
            console.log('');
            const result = yield (0, api_1.takeSnapshots)({
                scenario: Object.assign(Object.assign({}, scenario), { url: () => serverURL, leakFilter: (node) => {
                        if ((classNames.has(node.name) &&
                            !allowedLeaks.includes(node.name)) ||
                            node.retainedSize > 1000000) {
                            if (!expectToFail) {
                                console.log(`LEAK FOUND! Name of constructor: ${node.name} Retained Size: ${node.retainedSize}`);
                            }
                            return true; // This is considered to be a leak.
                        }
                        return false;
                    } }),
            });
            const leaks = yield (0, api_1.findLeaks)(result);
            if (expectToFail) {
                (0, chai_1.expect)(leaks.length).to.be.greaterThan(0, 'no memory leak detected, but was expected in this case');
            }
            else {
                (0, chai_1.expect)(leaks.length).to.equal(0, 'memory leak detected');
            }
        }));
    }
});
