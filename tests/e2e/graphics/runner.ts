import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FileToServe, runTests } from '../runner';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFilePath);

if (process.argv.length < 4) {
	console.log(
		'Usage: runner PATH_TO_GOLDEN_STANDALONE_MODULE PATH_TO_TEST_STANDALONE_MODULE'
	);
	console.log('Options:');
	console.log('  --bail           Exit on first test failure');
	console.log('  --grep <pattern> Only run tests matching <pattern>');
	process.exit(1);
}

let bail = false;
let grep: string | undefined;

const args = process.argv.slice(2);
const goldenStandalonePath = args[0];
const testStandalonePath = args[1];
const remainingArgs = args.slice(2);
const additionalTestFiles: string[] = [];

for (let i = 0; i < remainingArgs.length; i++) {
	const arg = remainingArgs[i];
	if (arg === '--bail') {
		bail = true;
	} else if (arg === '--grep') {
		if (i + 1 < remainingArgs.length) {
			grep = remainingArgs[i + 1];
			i++; // Skip the next argument as it has been used as the pattern
		} else {
			console.error('Error: Missing argument for --grep');
			process.exit(1);
		}
	} else {
		additionalTestFiles.push(arg);
	}
}

if (bail) {
	process.env.BAIL = 'true';
}
if (grep) {
	process.env.GREP = grep;
}

const testFiles = [
	resolve(currentDirectory, './graphics-test-cases.ts'),
	...additionalTestFiles,
];

const filesToServe: FileToServe[] = [
	{
		name: 'golden.js',
		filePath: resolve(goldenStandalonePath),
		envVar: 'GOLDEN_STANDALONE_PATH',
	},
	{
		name: 'test.js',
		filePath: resolve(testStandalonePath),
		envVar: 'TEST_STANDALONE_PATH',
	},
];

void runTests(testFiles, filesToServe, 16 * 60 * 1000);
