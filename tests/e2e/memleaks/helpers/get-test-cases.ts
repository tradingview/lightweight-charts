/// <reference types="node" />

import * as fs from 'fs';
import * as path from 'path';

export interface TestCase {
	name: string;
	caseContent: string;
}

const testCasesDir = path.join(__dirname, '..', 'test-cases');

function extractTestCaseName(fileName: string): string | null {
	const match = fileName.match(/^([^\.].+)\.js$/);
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
			caseContent: fs.readFileSync(path.join(testCasesDir, testCaseFile), { encoding: 'utf-8' }),
		}));
}
