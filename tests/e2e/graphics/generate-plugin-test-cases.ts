import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resizeObserverPolyfill } from './generate-test-cases';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const pluginPageContent = fs.readFileSync(
	path.join(currentDirectory, 'helpers', 'test-page-plugin.html'),
	{ encoding: 'utf-8' }
);

export function generatePluginPageContent(
	libraryModulePath: string,
	pluginPackageName: string,
	pluginModulePath: string,
	testCaseCode: string,
	buildMode: 'production' | 'development',
	entryPoint: 'runTestCase' | 'beforeInteractions' = 'runTestCase'
): string {
	return pluginPageContent
		.replace('//RESIZE_OBSERVER_POLYFILL', resizeObserverPolyfill)
		.replace('PATH_TO_STANDALONE_MODULE', libraryModulePath)
		.split('PLUGIN_PACKAGE_NAME').join(pluginPackageName)
		.replace('PATH_TO_PLUGIN_MODULE', pluginModulePath)
		.replace('TEST_CASE_SCRIPT', testCaseCode)
		.replace('TEST_CASE_ENTRY_POINT', entryPoint)
		.replace('{BUILD_MODE}', buildMode);
}
