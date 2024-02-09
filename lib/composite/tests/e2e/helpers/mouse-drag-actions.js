"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doKineticAnimation = exports.doHorizontalDrag = exports.doVerticalDrag = void 0;
const tslib_1 = require("tslib");
const page_timeout_1 = require("./page-timeout");
function doVerticalDrag(page, element) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const elBox = (yield element.boundingBox());
        const elMiddleX = elBox.x + elBox.width / 2;
        const elMiddleY = elBox.y + elBox.height / 2;
        // move mouse to the middle of element
        yield page.mouse.move(elMiddleX, elMiddleY);
        yield page.mouse.down({ button: 'left' });
        yield page.mouse.move(elMiddleX, elMiddleY - 20);
        yield page.mouse.move(elMiddleX, elMiddleY + 40);
        yield page.mouse.up({ button: 'left' });
    });
}
exports.doVerticalDrag = doVerticalDrag;
function doHorizontalDrag(page, element) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const elBox = (yield element.boundingBox());
        const elMiddleX = elBox.x + elBox.width / 2;
        const elMiddleY = elBox.y + elBox.height / 2;
        // move mouse to the middle of element
        yield page.mouse.move(elMiddleX, elMiddleY);
        yield page.mouse.down({ button: 'left' });
        yield page.mouse.move(elMiddleX - 20, elMiddleY);
        yield page.mouse.move(elMiddleX + 40, elMiddleY);
        yield page.mouse.up({ button: 'left' });
    });
}
exports.doHorizontalDrag = doHorizontalDrag;
function doKineticAnimation(page, element) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const elBox = (yield element.boundingBox());
        const elMiddleX = elBox.x + elBox.width / 2;
        const elMiddleY = elBox.y + elBox.height / 2;
        // move mouse to the middle of element
        yield page.mouse.move(elMiddleX, elMiddleY);
        yield page.mouse.down({ button: 'left' });
        yield (0, page_timeout_1.pageTimeout)(page, 50);
        yield page.mouse.move(elMiddleX - 40, elMiddleY);
        yield page.mouse.move(elMiddleX - 55, elMiddleY);
        yield page.mouse.move(elMiddleX - 105, elMiddleY);
        yield page.mouse.move(elMiddleX - 155, elMiddleY);
        yield page.mouse.move(elMiddleX - 205, elMiddleY);
        yield page.mouse.move(elMiddleX - 255, elMiddleY);
        yield page.mouse.up({ button: 'left' });
        yield (0, page_timeout_1.pageTimeout)(page, 200);
        // stop animation
        yield page.mouse.down({ button: 'left' });
        yield page.mouse.up({ button: 'left' });
    });
}
exports.doKineticAnimation = doKineticAnimation;
