"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortSources = void 0;
const assertions_1 = require("../helpers/assertions");
function sortSources(sources) {
    return sources.slice().sort((s1, s2) => {
        return ((0, assertions_1.ensureNotNull)(s1.zorder()) - (0, assertions_1.ensureNotNull)(s2.zorder()));
    });
}
exports.sortSources = sortSources;
