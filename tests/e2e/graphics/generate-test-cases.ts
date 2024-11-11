import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const dummyContent = fs.readFileSync(
	path.join(currentDirectory, 'helpers', 'test-page-dummy.html'),
	{ encoding: 'utf-8' }
);
const resizeObserverPolyfill =
	fs
		.readFileSync(
			path.join(
				currentDirectory,
				...'../../../node_modules/@juggle/resize-observer/lib/exports/resize-observer.umd.js'.split(
					'/'
				)
			),
			{ encoding: 'utf-8' }
		)
		.replace(/global\.ResizeObserver/g, 'global.ResizeObserverPolyfill') +
	'; window.ResizeObserver = window.ResizeObserverPolyfill.ResizeObserver';

export function generatePageContent(
	standaloneBundlePath: string,
	testCaseCode: string,
	buildMode: 'production' | 'development'
): string {
	return dummyContent
		.replace('//RESIZE_OBSERVER_POLYFILL', resizeObserverPolyfill)
		.replace('PATH_TO_STANDALONE_MODULE', standaloneBundlePath || 'PATH_TO_STANDALONE_MODULE') // keep string if using BRANCH_SPECIFIC_TEST
		.replace('TEST_CASE_SCRIPT', testCaseCode)
		.replace('{BUILD_MODE}', buildMode);
}
