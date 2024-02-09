"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preventScrollByWheelClick = void 0;
const browsers_1 = require("./browsers");
function preventScrollByWheelClick(el) {
    if (!(0, browsers_1.isChrome)()) {
        return;
    }
    el.addEventListener('mousedown', (e) => {
        if (e.button === 1 /* MouseEventButton.Middle */) {
            // prevent incorrect scrolling event
            e.preventDefault();
            return false;
        }
        return undefined;
    });
}
exports.preventScrollByWheelClick = preventScrollByWheelClick;
