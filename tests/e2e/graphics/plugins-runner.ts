import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FileToServe, runTests } from '../runner';
import { findPluginStandalone, getPluginTestCases, packagesDir } from './helpers/get-plugin-test-cases';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFilePath);

function usage(): never {
	console.log(
		'Usage: plugins-runner PATH_TO_GOLDEN_STANDALONE_ESM_MODULE PATH_TO_TEST_STANDALONE_ESM_MODULE [options]'
	);
	console.log('Options:');
	console.log('  --golden-plugins-dir <dir> Folder holding the golden plugin builds (default: none, every case is skipped)');
	console.log('  --test-plugins-dir <dir>   Folder holding the plugin packages under test (default: packages/)');
	console.log('  --bail                     Exit on first test failure');
	console.log('  --grep <pattern>           Only run tests matching <pattern>');
	process.exit(1);
}

if (process.argv.length < 4) {
	usage();
}

const args = process.argv.slice(2);
const goldenStandalonePath = resolve(args[0]);
const testStandalonePath = resolve(args[1]);
let goldenPluginsDir = '';
let testPluginsDir = packagesDir;

for (let i = 2; i < args.length; i++) {
	const arg = args[i];
	const value = (): string => {
		if (i + 1 >= args.length) {
			console.error(`Error: Missing argument for ${arg}`);
			process.exit(1);
		}
		return args[++i];
	};
	if (arg === '--bail') {
		process.env.BAIL = 'true';
	} else if (arg === '--grep') {
		process.env.GREP = value();
	} else if (arg === '--golden-plugins-dir') {
		goldenPluginsDir = resolve(value());
	} else if (arg === '--test-plugins-dir') {
		testPluginsDir = resolve(value());
	} else {
		usage();
	}
}

process.env.GOLDEN_PLUGINS_DIR = goldenPluginsDir;
process.env.TEST_PLUGINS_DIR = testPluginsDir;

const filesToServe: FileToServe[] = [
	{
		name: 'golden.mjs',
		filePath: goldenStandalonePath,
		envVar: 'GOLDEN_STANDALONE_PATH',
	},
	{
		name: 'test.mjs',
		filePath: testStandalonePath,
		envVar: 'TEST_STANDALONE_PATH',
	},
];

// Only builds that exist are served; the test file skips or fails the rest.
for (const group of getPluginTestCases()) {
	const testBuild = findPluginStandalone(testPluginsDir, group);
	if (testBuild !== null) {
		filesToServe.push({ name: `test-${group.folder}.js`, filePath: testBuild });
	}
	const goldenBuild = goldenPluginsDir ? findPluginStandalone(goldenPluginsDir, group) : null;
	if (goldenBuild !== null) {
		filesToServe.push({ name: `golden-${group.folder}.js`, filePath: goldenBuild });
	}
}

void runTests(
	[resolve(currentDirectory, './plugin-graphics-test-cases.ts')],
	filesToServe,
	16 * 60 * 1000
);
