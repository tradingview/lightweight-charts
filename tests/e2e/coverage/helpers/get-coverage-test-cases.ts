/// <reference types="node" />
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getTestCases as getTestCasesImpl, TestCase } from '../../helpers/get-test-cases';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFilePath);

const testCasesDir = join(currentDirectory, '..', 'test-cases');

export function getTestCases(): Record<string, TestCase[]> {
	return getTestCasesImpl(testCasesDir);
}
