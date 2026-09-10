/// <reference types="node" />
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getTestCases as getTestCasesImpl, TestCase } from '../../helpers/get-test-cases';

import { getPluginTestCases, PluginTestCasesGroup } from '../../graphics/helpers/get-plugin-test-cases';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFilePath);

const testCasesDir = join(currentDirectory, '..', 'test-cases');

export interface InteractionTestCase extends TestCase {
	plugin?: PluginTestCasesGroup;
}

export function getTestCases(): Record<string, InteractionTestCase[]> {
	const groups: Record<string, InteractionTestCase[]> = getTestCasesImpl(testCasesDir);
	for (const plugin of getPluginTestCases('interactions')) {
		groups[plugin.folder] = plugin.testCases.map((testCase: TestCase) => ({ ...testCase, plugin }));
	}
	if (process.env.GREP) {
		const filter = new RegExp(process.env.GREP);
		for (const name of Object.keys(groups)) {
			groups[name] = groups[name].filter((testCase: InteractionTestCase) => filter.test(`${name}/${testCase.name}`));
		}
	}
	return groups;
}
