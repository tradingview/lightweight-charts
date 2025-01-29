/// <reference types="node" />
import * as fs from 'fs';

import { glob } from 'glob';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const srcDir = path.join(currentDirectory, '..', '..', '..', '..', 'src');

const classNameRegex = /class\s+([a-zA-Z_][^\W<{]*)/gm;

/**
 * This will get all the class names within the source code.
 * This is used within the mem leaks to ensure that no instances
 * of these classes exist in the memory heap.
 */
export async function getClassNames(): Promise<Set<string>> {
	const sourceFiles = await glob(`${srcDir}/**/*.ts`);
	const classNames: Set<string> = new Set();
	sourceFiles.forEach((sourceFilePath: string) => {
		const content = fs.readFileSync(sourceFilePath, { encoding: 'utf-8' });
		const matches = content.matchAll(classNameRegex);
		for (const match of matches) {
			classNames.add(match[1]);
		}
	});
	return classNames;
}
