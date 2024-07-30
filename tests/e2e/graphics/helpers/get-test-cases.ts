/// <reference types="node" />
import * as fs from 'fs';

import { basename, dirname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFilePath);

export interface TestCase {
	name: string;
	caseContent: string;
}

const testCasesDir = join(currentDirectory, '..', 'test-cases');

function splitPathToFolders(inputPath: string): string[] {
	const normalizedPath = normalize(inputPath);
	const folders = normalizedPath.split(sep).filter(Boolean);
	return folders;
}

function extractTestCaseNameAndFolder(fileName: string): string | null {
	const parentFolderAndFileName = splitPathToFolders(fileName).slice(-2).join('/');
	const match = /^([^.].+)\.js$/.exec(parentFolderAndFileName);
	return match && match[1];
}

function extractTestCaseName(fileName: string): string | null {
	const match = /^([^.].+)\.js$/.exec(basename(fileName));
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
			.filter((filePath: string) => fs.lstatSync(join(testCasesDir, filePath)).isDirectory())
			.map((filePath: string) => {
				return {
					name: filePath,
					path: join(testCasesDir, filePath),
				};
			}),
	];
}

let testFilterRegex: RegExp;
if (process.env.GREP) {
	testFilterRegex = new RegExp(process.env.GREP);
}

export function getTestCases(): Record<string, TestCase[]> {
	const result: Record<string, TestCase[]> = {};

	for (const group of getTestCaseGroups()) {
		const groupFiles = fs.readdirSync(group.path)
			.map((filePath: string) => join(group.path, filePath))
			.filter(isTestCaseFile)
			.filter((testCaseFile: string) => {
				if (!testFilterRegex) {
					return true;
				}
				const name = extractTestCaseNameAndFolder(testCaseFile);
				if (name) {
					return testFilterRegex.test(name);
				}
				return true;
			})
			.map((testCaseFile: string) => {
				return {
					name: extractTestCaseName(testCaseFile) as string,
					caseContent: fs.readFileSync(testCaseFile, { encoding: 'utf-8' }),
				};
			});
		if (groupFiles.length > 0) {
			result[group.name] = groupFiles;
		}
	}

	return result;
}
