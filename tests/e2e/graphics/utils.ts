import * as fs from 'node:fs';
import * as path from 'node:path';

export function rmRf(dir: string): void {
	if (!fs.existsSync(dir)) {
		return;
	}

	fs.readdirSync(dir).forEach((file: string) => {
		const filePath = path.join(dir, file);
		if (fs.lstatSync(filePath).isDirectory()) {
			rmRf(filePath);
		} else {
			fs.unlinkSync(filePath);
		}
	});

	fs.rmdirSync(dir);
}

export function removeEmptyDirsRecursive(rootDir: string): void {
	if (!fs.existsSync(rootDir)) {
		return;
	}

	fs.readdirSync(rootDir).forEach((file: string) => {
		const filePath = path.join(rootDir, file);
		if (fs.lstatSync(filePath).isDirectory()) {
			removeEmptyDirsRecursive(filePath);
		}
	});

	if (fs.readdirSync(rootDir).length === 0) {
		fs.rmdirSync(rootDir);
	}
}

export function withTimeout<P>(promise: Promise<P>, ms: number): Promise<P> {
	const timeoutPromise = new Promise<P>(
		(
			resolve: (value: P | PromiseLike<P>) => void,
			reject: (reason?: unknown) => void
		) => {
			setTimeout(
				() => reject(new Error(`Operation timed out after ${ms} ms`)),
				ms
			);
		}
	);
	return Promise.race([promise, timeoutPromise]);
}
