"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseCanvas = exports.createBoundCanvas = void 0;
const fancy_canvas_1 = require("fancy-canvas");
const assertions_1 = require("../helpers/assertions");
function createBoundCanvas(parentElement, size) {
    const doc = (0, assertions_1.ensureNotNull)(parentElement.ownerDocument);
    const canvas = doc.createElement('canvas');
    parentElement.appendChild(canvas);
    const binding = (0, fancy_canvas_1.bindCanvasElementBitmapSizeTo)(canvas, {
        type: 'device-pixel-content-box',
        options: {
            allowResizeObserver: false,
        },
        transform: (bitmapSize, canvasElementClientSize) => ({
            width: Math.max(bitmapSize.width, canvasElementClientSize.width),
            height: Math.max(bitmapSize.height, canvasElementClientSize.height),
        }),
    });
    binding.resizeCanvasElement(size);
    return binding;
}
exports.createBoundCanvas = createBoundCanvas;
function releaseCanvas(canvas) {
    var _a;
    // This function fixes the iOS Safari error "Total canvas memory use exceeds the maximum limit".
    // Seems that iOS Safari stores canvas elements for some additional time internally.
    // So if we create/destroy a lot of canvas elements in a short period of time we can get this error.
    // We resize the canvas to 1x1 pixels to force it to release memmory resources.
    canvas.width = 1;
    canvas.height = 1;
    (_a = canvas.getContext('2d')) === null || _a === void 0 ? void 0 : _a.clearRect(0, 0, 1, 1);
}
exports.releaseCanvas = releaseCanvas;
