/// <reference types="node" />

import * as fs from 'fs';
import * as path from 'path';

export interface TestCase {
	name: string;
	caseContent: string;
}

const testCasesDir = path.join(__dirname, '..', 'test-cases');

function extractTestCaseName(fileName: string): string | null {
	const match = path.basename(fileName).match(/^([^\.].+)\.js$/);
	return match && match[1];
}

function isTestCaseFile(filePath: string): boolean {
	return fs.lstatSync(filePath).isFile() && extractTestCaseName(filePath) !== null;
}

interface TestCasesGroupInfo {
	name: string;
	path: string;
}

function getTestCaseGroups(): TestCasesGroupInfo[] {
	return [
		{
			name: '',
			path: testCasesDir,
		},
		...fs.readdirSync(testCasesDir)
			.filter((filePath: string) => fs.lstatSync(path.join(testCasesDir, filePath)).isDirectory())
			.map((filePath: string) => {
				return {
					name: filePath,
					path: path.join(testCasesDir, filePath),
				};
			}),
	];
}

export function getTestCases(): Record<string, TestCase[]> {
	const result: Record<string, TestCase[]> = {};

	for (const group of getTestCaseGroups()) {
		result[group.name] = fs.readdirSync(group.path)
			.map((filePath: string) => path.join(group.path, filePath))
			.filter(isTestCaseFile)
			.map((testCaseFile: string) => {
				return {
					name: extractTestCaseName(testCaseFile) as string,
					caseContent: fs.readFileSync(testCaseFile, { encoding: 'utf-8' }),
				};
			});
	}

	return result;
}
