#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const Mocha = require('mocha');

const serveLocalFiles = require('../serve-local-files').serveLocalFiles;

const mochaConfig = require('../../../.mocharc.js');

// override tsconfig
process.env.TS_NODE_PROJECT = path.resolve(__dirname, '../tsconfig.json');

mochaConfig.require.forEach((module) => {
	require(module);
});

if (process.argv.length !== 4) {
	console.log('Usage: runner PATH_TO_GOLDEN_STANDALONE_MODULE PATH_TO_TEST_STANDALONE_MODULE');
	process.exit(1);
}

const startTime = Date.now();

let goldenStandalonePath = process.argv[2];
let testStandalonePath = process.argv[3];

const hostname = 'localhost';
const port = 34567;
const httpServerPrefix = `http://${hostname}:${port}/`;

const filesToServe = new Map();
if (fs.existsSync(goldenStandalonePath)) {
	const fileNameToServe = 'golden.js';
	filesToServe.set(fileNameToServe, path.resolve(goldenStandalonePath));
	goldenStandalonePath = `${httpServerPrefix}${fileNameToServe}`;
}

if (fs.existsSync(testStandalonePath)) {
	const fileNameToServe = 'test.js';
	filesToServe.set(fileNameToServe, path.resolve(testStandalonePath));
	testStandalonePath = `${httpServerPrefix}${fileNameToServe}`;
}

process.env.GOLDEN_STANDALONE_PATH = goldenStandalonePath;
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
	mocha.addFile(path.resolve(__dirname, './graphics-test-cases.ts'));

	mocha.run(failures => {
		if (closeServer !== null) {
			closeServer();
		}

		const timeInSecs = (Date.now() - startTime) / 1000;
		console.log(`Done in ${timeInSecs.toFixed(2)}s with ${failures} error(s)`);

		process.exitCode = failures !== 0 ? 1 : 0;
	});
}

serveLocalFiles(filesToServe, port, hostname)
	.then(runMocha);
