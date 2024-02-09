"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassNames = void 0;
const tslib_1 = require("tslib");
/// <reference types="node" />
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const glob_1 = require("glob");
const srcDir = path.join(__dirname, '..', '..', '..', '..', 'src');
const classNameRegex = /class\s+([a-zA-Z_][^\W<{]*)/gm;
/**
 * This will get all the class names within the source code.
 * This is used within the mem leaks to ensure that no instances
 * of these classes exist in the memory heap.
 */
function getClassNames() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const sourceFiles = yield (0, glob_1.glob)(`${srcDir}/**/*.ts`);
        const classNames = new Set();
        sourceFiles.forEach((sourceFilePath) => {
            const content = fs.readFileSync(sourceFilePath, { encoding: 'utf-8' });
            const matches = content.matchAll(classNameRegex);
            for (const match of matches) {
                classNames.add(match[1]);
            }
        });
        return classNames;
    });
}
exports.getClassNames = getClassNames;
