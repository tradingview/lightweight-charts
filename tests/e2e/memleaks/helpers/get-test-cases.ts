/// <reference types="node" />
import * as fs from 'fs';

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

export interface TestCase {
	name: string;
	path: string;
}

const testCasesDir = path.join(currentDirectory, '..', 'test-cases');

function extractTestCaseName(fileName: string): string | null {
	const match = /^([^.].+)\.js$/.exec(fileName);
	return match && match[1];
}

function isTestCaseFile(filePath: string): boolean {
	return fs.lstatSync(path.join(testCasesDir, filePath)).isFile() && extractTestCaseName(filePath) !== null;
}

export function getTestCases(): TestCase[] {
	return fs.readdirSync(testCasesDir)
		.filter(isTestCaseFile)
		.map<TestCase>((testCaseFile: string) => ({
			name: extractTestCaseName(testCaseFile) as string,
			path: path.join(testCasesDir, testCaseFile),
		}));
}
