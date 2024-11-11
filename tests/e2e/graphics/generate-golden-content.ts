import * as fs from 'node:fs';
import * as path from 'node:path';

import { generatePageContent } from './generate-test-cases';
import { getTestCases, TestCase } from './helpers/get-test-cases';
import { rmRf } from './utils';

if (process.argv.length < 3) {
	console.log(
		'Usage: generate-golden-content GOLDEN_OUTPUT_PATH'
	);
	process.exit(1);
}

const args = process.argv.slice(2);
const goldenOutputPath = args[0];

const buildMode =
	process.env.PRODUCTION_BUILD === 'true' ? 'production' : 'development';

const testCases = getTestCases();

rmRf(goldenOutputPath);
fs.mkdirSync(goldenOutputPath, { recursive: true });

for (const groupName of Object.keys(testCases)) {
	generateTestCases(groupName, testCases[groupName]);
}

function generateTestCases(groupName: string, groupTestCases: TestCase[]): void {
	for (const testCase of groupTestCases) {
		const testCaseOutDir = path.join(goldenOutputPath, groupName, testCase.name);
		rmRf(testCaseOutDir);
		fs.mkdirSync(testCaseOutDir, { recursive: true });
		path.join(testCaseOutDir, 'test-content.html');

		const goldenPageContent = generatePageContent(
			'',
			testCase.caseContent,
			buildMode
		);

		fs.writeFileSync(
			path.join(testCaseOutDir, 'test-content.html'),
			goldenPageContent
		);
	}
}
