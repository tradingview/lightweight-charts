"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const LightweightChartsModule = tslib_1.__importStar(require("./index"));
// put all exports from package to window.LightweightCharts object
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
window.LightweightCharts = LightweightChartsModule;
