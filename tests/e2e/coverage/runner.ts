import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FileToServe, runTests } from '../runner';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFilePath);

if (process.argv.length < 3) {
	console.log(
		'Usage: runner PATH_TO_TEST_STANDALONE_MODULE [ADDITIONAL_TEST_FILES...]'
	);
	process.exit(1);
}

const testStandalonePath = process.argv[2];
const additionalTestFiles = process.argv.slice(3);
const testFiles = [
	resolve(currentDirectory, './coverage-test-cases.ts'),
	...additionalTestFiles,
];

const filesToServe: FileToServe[] = [
	{
		name: 'test.js',
		filePath: resolve(testStandalonePath),
		envVar: 'TEST_STANDALONE_PATH',
	},
];

void runTests(testFiles, filesToServe, 3 * 60 * 1000);
