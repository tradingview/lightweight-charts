import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { run } from 'node:test';
import { spec as Spec } from 'node:test/reporters';
import { fileURLToPath } from 'node:url';

import { serveLocalFiles } from './serve-local-files';

export interface FileToServe {
	/** Name for the file when hosted on the localhost server */
	name: string;
	/** Path to the file on the system */
	filePath: string;
	/** ENV var name to assign with the value of the hosted address for this file */
	envVar?: string;
}

export async function runTests(
	testFiles: string[],
	filesToServe: FileToServe[],
	timeoutLimit?: number
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

	const filesToServeLocally = new Map<string, string>();

	for (const { name, filePath, envVar } of filesToServe) {
		filesToServeLocally.set(name, filePath);
		if (envVar) {
			const address = `${httpServerPrefix}${name}`;
			process.env[envVar] = address;
		}
	}

	await new Promise<void>((resolver: () => void) => setTimeout(resolver, 1000));
	console.log('filesToServeLocally', Object.fromEntries(filesToServeLocally));
	const closeServer = await serveLocalFiles(filesToServeLocally, port, hostname);

	const spec = new Spec();

	let exitCode = 0;

	const start = Date.now();

	const testStream = run({
		files: testFiles,
		timeout: timeoutLimit, // total timeout for all test cases
		concurrency: 1,
	});

	testStream.compose<NodeJS.ReadableStream>(spec).pipe(process.stdout);

	const summary: string[] = [];

	testStream.on('test:fail', (data: TestFail) => {
		exitCode = 1;
		const error = data.details.error;

		summary.push(
			`${data.file} - "${data.name}" (${Math.round(
				data.details.duration_ms
			// eslint-disable-next-line @typescript-eslint/no-base-to-string
			)}ms)\n${error.toString()} `
		);
	});

	testStream.on('test:stderr', (data: TestStderr) => {
		summary.push(`${data.file} - Error:\n${data.message} `);
	});

	testStream.once('end', () => {
		if (closeServer !== null) {
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
