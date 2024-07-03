import { dirname, join, resolve } from 'node:path';
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
	resolve(currentDirectory, './memleaks-test-cases.ts'),
	...additionalTestFiles,
];

const filesToServe: FileToServe[] = [
	{
		name: 'library.js',
		filePath: resolve(testStandalonePath),
	},
	{
		name: 'index.html',
		filePath: join(currentDirectory, 'helpers', 'test-page.html'),
		envVar: 'SERVER_ADDRESS',
	},
];

void runTests(testFiles, filesToServe, 8 * 60 * 1000);
