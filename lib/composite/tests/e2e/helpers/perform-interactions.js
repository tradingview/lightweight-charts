"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performInteractions = void 0;
const tslib_1 = require("tslib");
const mouse_drag_actions_1 = require("./mouse-drag-actions");
const mouse_scroll_actions_1 = require("./mouse-scroll-actions");
const page_timeout_1 = require("./page-timeout");
const touch_actions_1 = require("./touch-actions");
const zoom_action_1 = require("./zoom-action");
// eslint-disable-next-line complexity
function performAction(interaction, page, target) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const action = interaction.action;
        switch (action) {
            case 'scrollLeft':
                yield (0, mouse_scroll_actions_1.doMouseScroll)({ x: -10.0 }, page);
                break;
            case 'scrollRight':
                yield (0, mouse_scroll_actions_1.doMouseScroll)({ x: 10.0 }, page);
                break;
            case 'scrollDown':
                yield (0, mouse_scroll_actions_1.doMouseScroll)({ y: 10.0 }, page);
                break;
            case 'scrollUp':
                yield (0, mouse_scroll_actions_1.doMouseScroll)({ y: -10.0 }, page);
                break;
            case 'scrollUpRight':
                yield (0, mouse_scroll_actions_1.doMouseScroll)({ y: 10.0, x: 10.0 }, page);
                break;
            case 'scrollDownLeft':
                yield (0, mouse_scroll_actions_1.doMouseScroll)({ y: -10.0, x: -10.0 }, page);
                break;
            case 'click':
                yield target.click({ button: 'left' });
                break;
            case 'doubleClick':
                yield target.click({ button: 'left' });
                yield (0, page_timeout_1.pageTimeout)(page, 200);
                yield target.click({ button: 'left' });
                break;
            case 'outsideClick':
                {
                    const boundingBox = yield target.boundingBox();
                    if (boundingBox) {
                        yield page.mouse.click(boundingBox.x + boundingBox.width + 20, boundingBox.y + boundingBox.height + 50, { button: 'left' });
                    }
                }
                break;
            case 'clickXY':
                {
                    const boundingBox = yield target.boundingBox();
                    if (boundingBox) {
                        yield page.mouse.click(boundingBox.x + interaction.options.x, boundingBox.y + interaction.options.y);
                    }
                }
                break;
            case 'viewportZoomInOut':
                yield (0, zoom_action_1.doZoomInZoomOut)(page);
                break;
            case 'verticalDrag':
                yield (0, mouse_drag_actions_1.doVerticalDrag)(page, target);
                break;
            case 'horizontalDrag':
                yield (0, mouse_drag_actions_1.doHorizontalDrag)(page, target);
                break;
            case 'tap':
                {
                    const boundingBox = yield target.boundingBox();
                    if (boundingBox) {
                        yield page.touchscreen.tap(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
                    }
                }
                break;
            case 'longTouch':
                yield (0, touch_actions_1.doLongTouch)(page, target, 500);
                break;
            case 'pinchZoomIn':
                {
                    const devToolsSession = yield page.target().createCDPSession();
                    yield (0, touch_actions_1.doPinchZoomTouch)(devToolsSession, target, true);
                }
                break;
            case 'pinchZoomOut':
                {
                    const devToolsSession = yield page.target().createCDPSession();
                    yield (0, touch_actions_1.doPinchZoomTouch)(devToolsSession, target);
                }
                break;
            case 'swipeTouchHorizontal':
                {
                    const devToolsSession = yield page.target().createCDPSession();
                    yield (0, touch_actions_1.doSwipeTouch)(devToolsSession, target, { horizontal: true });
                }
                break;
            case 'swipeTouchVertical':
                {
                    const devToolsSession = yield page.target().createCDPSession();
                    yield (0, touch_actions_1.doSwipeTouch)(devToolsSession, target, { vertical: true });
                }
                break;
            case 'swipeTouchDiagonal':
                {
                    const devToolsSession = yield page.target().createCDPSession();
                    yield (0, touch_actions_1.doSwipeTouch)(devToolsSession, target, {
                        vertical: true,
                        horizontal: true,
                    });
                }
                break;
            case 'kineticAnimation':
                yield (0, mouse_drag_actions_1.doKineticAnimation)(page, target);
                break;
            case 'moveMouseCenter':
                {
                    const boundingBox = yield target.boundingBox();
                    if (boundingBox) {
                        yield page.mouse.move(boundingBox.width / 2, boundingBox.height / 2);
                    }
                }
                break;
            case 'moveMouseTopLeft':
                {
                    const boundingBox = yield target.boundingBox();
                    if (boundingBox) {
                        yield page.mouse.move(boundingBox.x, boundingBox.y);
                    }
                }
                break;
            default: {
                const exhaustiveCheck = action;
                throw new Error(exhaustiveCheck);
            }
        }
    });
}
function performInteractions(page, interactionsToPerform) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const chartContainer = (yield page.$('#container'));
        const leftPriceAxis = (yield chartContainer.$$('tr:nth-of-type(1) td:nth-of-type(1) div canvas'))[0];
        const paneWidget = (yield chartContainer.$$('tr:nth-of-type(1) td:nth-of-type(2) div canvas'))[0];
        const rightPriceAxis = (yield chartContainer.$$('tr:nth-of-type(1) td:nth-of-type(3) div canvas'))[0];
        const timeAxis = (yield chartContainer.$$('tr:nth-of-type(2) td:nth-of-type(2) div canvas'))[0];
        for (const interaction of interactionsToPerform) {
            let target;
            switch (interaction.target) {
                case undefined:
                case 'container':
                    target = chartContainer;
                    break;
                case 'leftpricescale':
                    target = leftPriceAxis;
                    break;
                case 'rightpricescale':
                    target = rightPriceAxis;
                    break;
                case 'timescale':
                    target = timeAxis;
                    break;
                case 'pane':
                    target = paneWidget;
                    break;
                default: {
                    const exhaustiveCheck = interaction.target;
                    throw new Error(exhaustiveCheck);
                }
            }
            yield performAction(interaction, page, target);
        }
    });
}
exports.performInteractions = performInteractions;
