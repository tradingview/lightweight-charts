/* eslint-disable @typescript-eslint/no-floating-promises */
import { findLeaks, takeSnapshots } from '@memlab/api';
import type { IHeapNode, IScenario } from '@memlab/core';
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { getClassNames } from './helpers/get-all-class-names';
import { getTestCases } from './helpers/get-test-cases';

const serverAddressVarName = 'SERVER_ADDRESS';
const serverURL: string = process.env[serverAddressVarName] || '';

interface ITestScenario extends IScenario {
	/**
	 * Set to true if the expected behavior of the test is to fail
	 */
	expectFail?: boolean;
	/**
	 * List of class names which are allowed to leak in this
	 * test.
	 * For example: a cache while the chart is still present
	 */
	allowedLeaks?: string[];
}

describe('Memleaks tests', async (): Promise<void> => {
	const testCases = getTestCases();

	await it('number of test cases', () => {
		// we need to have at least 1 test to check it
		expect(testCases.length).to.be.greaterThan(
			0,
			'there should be at least 1 test case'
		);
	});

	const classNames: Set<string> = new Set();

	for (const testCase of testCases) {
		it(testCase.name, async () => {
			console.log(`\n\tRunning test: ${testCase.name}`);
			if (classNames.size < 1) {
				// async function that we will only call if we don't already have values
				const names = await getClassNames();
				for (const name of names) {
					classNames.add(name);
				}
			}
			expect(classNames.size).to.be.greaterThan(
				0,
				'Class name list should contain items'
			);

			const test = await import(testCase.path);

			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const scenario = test.scenario as ITestScenario;
			const expectToFail = scenario.expectFail === true;
			const allowedLeaks = scenario.allowedLeaks ?? [];
			if (expectToFail) {
				console.log(`\t!! This test is expected to fail.`);
			}
			console.log('');

			const result = await takeSnapshots({
				scenario: {
					...scenario,
					url: () => serverURL,
					leakFilter: (node: IHeapNode) => {
						if ((classNames.has(node.name) &&
							!allowedLeaks.includes(node.name)) ||
							node.retainedSize > 1000000) {
							if (!expectToFail) {
								console.log(`LEAK FOUND! Name of constructor: ${node.name} Retained Size: ${node.retainedSize}`);
							}
							return true; // This is considered to be a leak.
						}
						return false;
					},
				},
			});
			const leaks = await findLeaks(result);

			if (expectToFail) {
				expect(leaks.length).to.be.greaterThan(
					0,
					'no memory leak detected, but was expected in this case'
				);
			} else {
				expect(leaks.length).to.equal(0, 'memory leak detected');
			}
		});
	}
});
