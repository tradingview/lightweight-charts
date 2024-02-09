"use strict";
/// <reference types="node" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.Screenshoter = void 0;
const tslib_1 = require("tslib");
const pngjs_1 = require("pngjs");
const puppeteer_1 = tslib_1.__importDefault(require("puppeteer"));
const viewportWidth = 600;
const viewportHeight = 600;
class Screenshoter {
    constructor(noSandbox, devicePixelRatio = 1) {
        const puppeteerOptions = {
            defaultViewport: {
                deviceScaleFactor: devicePixelRatio,
                width: viewportWidth,
                height: viewportHeight,
            },
        };
        if (noSandbox) {
            puppeteerOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
        }
        // note that we cannot use launchPuppeteer here as soon it wrong typing in puppeteer
        // see https://github.com/puppeteer/puppeteer/issues/7529
        this._browserPromise = puppeteer_1.default.launch(puppeteerOptions);
    }
    close() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const browser = yield this._browserPromise;
            yield browser.close();
        });
    }
    generateScreenshot(pageContent) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let page;
            try {
                const browser = yield this._browserPromise;
                page = yield browser.newPage();
                const errors = [];
                page.on('pageerror', (error) => {
                    errors.push(error.message);
                });
                page.on('console', (message) => {
                    const type = message.type();
                    if (type === 'error' || type === 'assert') {
                        errors.push(`Console ${type}: ${message.text()}`);
                    }
                });
                page.on('response', (response) => {
                    if (!response.ok()) {
                        errors.push(`Network error: ${response.url()} status=${response.status()}`);
                    }
                });
                yield page.setContent(pageContent, { waitUntil: 'load' });
                // wait for test case is ready
                yield page.evaluate(() => {
                    return window.testCaseReady;
                });
                const shouldIgnoreMouseMove = yield page.evaluate(() => {
                    return Boolean(window.ignoreMouseMove);
                });
                if (!shouldIgnoreMouseMove) {
                    // move mouse to top-left corner
                    yield page.mouse.move(0, 0);
                }
                const waitForMouseMove = page.evaluate(() => {
                    if (window.ignoreMouseMove) {
                        return Promise.resolve();
                    }
                    return new Promise((resolve) => {
                        const chart = window.chart;
                        if (!chart) {
                            throw new Error('window variable `chart` is required unless `ignoreMouseMove` is set to true');
                        }
                        chart.subscribeCrosshairMove((param) => {
                            const point = param.point;
                            if (!point) {
                                return;
                            }
                            if (point.x > 0 && point.y > 0) {
                                requestAnimationFrame(() => resolve([point.x, point.y]));
                            }
                        });
                    });
                });
                if (!shouldIgnoreMouseMove) {
                    // to avoid random cursor position
                    yield page.mouse.move(viewportWidth / 2, viewportHeight / 2);
                    yield waitForMouseMove;
                }
                // let's wait until the next af to make sure that everything is repainted
                yield page.evaluate(() => {
                    return new Promise((resolve) => {
                        window.requestAnimationFrame(() => {
                            // and a little more time after af :)
                            // Note: This timeout value isn't part of the test and is only
                            //       included to improve the reliability of the test.
                            setTimeout(resolve, 250);
                        });
                    });
                });
                if (errors.length !== 0) {
                    throw new Error(errors.join('\n'));
                }
                const pageScreenshotPNG = pngjs_1.PNG.sync.read(yield page.screenshot({ encoding: 'binary' }));
                const additionalScreenshotDataURL = yield page.evaluate(() => {
                    const testCaseWindow = window;
                    if (!testCaseWindow.checkChartScreenshot) {
                        return Promise.resolve(null);
                    }
                    const chart = testCaseWindow.chart;
                    if (chart === undefined) {
                        return Promise.resolve(null);
                    }
                    return chart.takeScreenshot().toDataURL();
                });
                if (additionalScreenshotDataURL !== null) {
                    const additionalScreenshotBuffer = Buffer.from(additionalScreenshotDataURL.split(',')[1], 'base64');
                    const additionalScreenshotPNG = new pngjs_1.PNG();
                    yield new Promise((resolve, reject) => {
                        additionalScreenshotPNG.parse(additionalScreenshotBuffer, (error, data) => {
                            // eslint-disable-next-line @typescript-eslint/tslint/config
                            if (error === null) {
                                resolve(data);
                            }
                            else {
                                reject(error);
                            }
                        });
                    });
                    const additionalScreenshotPadding = 20;
                    additionalScreenshotPNG.bitblt(pageScreenshotPNG, 0, 0, 
                    // additionalScreenshotPNG could be cropped
                    Math.min(pageScreenshotPNG.width, additionalScreenshotPNG.width), additionalScreenshotPNG.height, 0, 
                    // additional screenshot height should be equal to HTML element height on page screenshot
                    additionalScreenshotPadding + additionalScreenshotPNG.height);
                }
                return pageScreenshotPNG;
            }
            finally {
                if (page !== undefined) {
                    yield page.close();
                }
            }
        });
    }
}
exports.Screenshoter = Screenshoter;
