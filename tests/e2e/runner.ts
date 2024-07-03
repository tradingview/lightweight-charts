import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { run } from 'node:test';
import { spec as Spec } from 'node:test/reporters';
import { fileURLToPath } from 'node:url';

import { serveLocalFiles } from './serve-local-files';

export async function runTests(
	testFiles: string[],
	testStandalonePath: string,
	indexPagePath: string
): Promise<void> {
	const currentFilePath = fileURLToPath(import.meta.url);
	const currentDirectory = dirname(currentFilePath);
	process.env.TS_NODE_PROJECT = resolve(
		currentDirectory,
		'./tsconfig.composite.json'
	);

	const hostname = 'localhost';
	const port = 34567;
	const httpServerPrefix = `http://${hostname}:${port}/`;
	let serverAddress = `${httpServerPrefix}index.html`;

	const filesToServe = new Map<string, string>();

	if (existsSync(testStandalonePath)) {
		const fileNameToServe = 'index.html';
		filesToServe.set(
			fileNameToServe,
			indexPagePath
		);
		serverAddress = `${httpServerPrefix}${fileNameToServe}`;
	}

	if (existsSync(testStandalonePath)) {
		const fileNameToServe = 'library.js';
		filesToServe.set(fileNameToServe, resolve(testStandalonePath));
		testStandalonePath = `${httpServerPrefix}${fileNameToServe}`;
	}

	process.env.SERVER_ADDRESS = serverAddress;

	const closeServer = await serveLocalFiles(filesToServe, port, hostname);

	const spec = new Spec();

	let exitCode = 0;

	const start = Date.now();

	const testStream = run({
		files: testFiles,
		timeout: 100 * 1000 * 4, // total timeout for all test cases
		concurrency: 1,
	});

	testStream.compose<Spec>(spec).pipe(process.stdout);

	const summary: string[] = [];

	testStream.on('test:fail', (data: TestFail) => {
		exitCode = 1;
		const error = data.details.error;

		summary.push(
			`${data.file} - "${data.name}" (${Math.round(
				data.details.duration_ms
			)}ms)\n${error.toString()} `
		);
	});

	testStream.on('test:stderr', (data: TestStderr) => {
		summary.push(`${data.file} - Error:\n${data.message} `);
	});

	testStream.once('end', () => {
		if (closeServer !== null) {
			console.log('closing');
			closeServer();
		}
		const duration = Date.now() - start;
		// print duration in blue
		console.log(
			'\x1b[34m%s\x1b[0m',
			`\nℹ Duration: ${duration / 1000}s\n`,
			'\x1b[0m'
		);
		if (summary.length > 0) {
			console.error('\x1b[31m%s\x1b', '\n✖ failing tests:\n');
			console.error(summary.join('\n'));
			console.error('\n------', '\x1b[0m\n');
		}
		process.exit(exitCode);
	});
}
