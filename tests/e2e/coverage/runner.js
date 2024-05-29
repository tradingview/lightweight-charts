#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import Mocha from 'mocha';
import { serveLocalFiles } from '../serve-local-files.js';

import mochaConfig from '../../../.mocharc.mjs';

// Override tsconfig
process.env.TS_NODE_PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../tsconfig.composite.json');

// Dynamically import the required modules from mochaConfig
async function loadMochaModules() {
	await Promise.all(mochaConfig.require.map(async module => {
		await import(module);
	}));
}

if (process.argv.length !== 3) {
	console.log('Usage: runner PATH_TO_TEST_STANDALONE_MODULE');
	process.exit(1);
}

const startTime = Date.now();

let testStandalonePath = process.argv[2];

const hostname = 'localhost';
const port = 34567;
const httpServerPrefix = `http://${hostname}:${port}/`;

const filesToServe = new Map();

if (fs.existsSync(testStandalonePath)) {
	const fileNameToServe = 'test.js';
	filesToServe.set(fileNameToServe, path.resolve(testStandalonePath));
	testStandalonePath = `${httpServerPrefix}${fileNameToServe}`;
}

process.env.TEST_STANDALONE_PATH = testStandalonePath;

function runMocha(closeServer) {
	console.log('Running tests...');
	const mocha = new Mocha({
		timeout: 20000,
		slow: 10000,
		reporter: mochaConfig.reporter,
		reporterOptions: mochaConfig._reporterOptions,
	});

	if (mochaConfig.checkLeaks) {
		mocha.checkLeaks();
	}

	mocha.diff(mochaConfig.diff);
	mocha.addFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), './coverage-test-cases.ts'));

	mocha.run(failures => {
		if (closeServer !== null) {
			closeServer();
		}

		const timeInSecs = (Date.now() - startTime) / 1000;
		console.log(`Done in ${timeInSecs.toFixed(2)}s with ${failures} error(s)`);

		process.exitCode = failures !== 0 ? 1 : 0;
	});
}

async function main() {
	await loadMochaModules();
	await serveLocalFiles(filesToServe, port, hostname);
	runMocha();
}

main();
