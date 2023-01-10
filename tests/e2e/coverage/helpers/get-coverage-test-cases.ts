/// <reference types="node" />

import * as path from 'path';

import { getTestCases as getTestCasesImpl, TestCase } from '../../helpers/get-test-cases';

const testCasesDir = path.join(__dirname, '..', 'test-cases');

export function getTestCases(): Record<string, TestCase[]> {
	return getTestCasesImpl(testCasesDir);
}
