import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findPluginStandalone, getPluginTestCases, packagesDir } from '../graphics/helpers/get-plugin-test-cases';
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
	resolve(currentDirectory, './interactions-test-cases.ts'),
	...additionalTestFiles,
];

const filesToServe: FileToServe[] = [
	{
		name: 'test.js',
		filePath: resolve(testStandalonePath),
		envVar: 'TEST_STANDALONE_PATH',
	},
];

const plugins = getPluginTestCases('interactions');
if (plugins.length > 0) {
	filesToServe.push({
		name: 'test.mjs',
		filePath: resolve(testStandalonePath.replace(/\.js$/, '.mjs')),
		envVar: 'TEST_STANDALONE_ESM_PATH',
	});
	for (const plugin of plugins) {
		const build = findPluginStandalone(packagesDir, plugin);
		if (build === null) {
			throw new Error(`Build ${plugin.packageName} before running interaction tests`);
		}
		filesToServe.push({ name: `${plugin.folder}.js`, filePath: build });
	}
}

void runTests(testFiles, filesToServe, 3 * 60 * 1000);
