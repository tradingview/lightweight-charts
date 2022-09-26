/// <reference types="node" />

import * as fs from 'fs';
import * as path from 'path';

export interface TestCase {
	name: string;
	caseContent: string;
}

function extractTestCaseName(fileName: string): string | null {
	const match = /^([^.].+)\.js$/.exec(path.basename(fileName));
	return match && match[1];
}

function isTestCaseFile(filePath: string): boolean {
	return fs.lstatSync(filePath).isFile() && extractTestCaseName(filePath) !== null;
}

interface TestCasesGroupInfo {
	name: string;
	path: string;
}

function getTestCaseGroups(testCasesDir: string): TestCasesGroupInfo[] {
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

export function getTestCases(testCasesDir: string): Record<string, TestCase[]> {
	const result: Record<string, TestCase[]> = {};

	for (const group of getTestCaseGroups(testCasesDir)) {
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
