'use strict';
import { resolve } from 'node:path';

// override tsconfig for tests
process.env.TS_NODE_PROJECT = resolve(__dirname, './tests/unittests/tsconfig.composite.json');

const config = {
	extension: ['ts'],
	checkLeaks: true,
	recursive: true,
	diff: true,
};

if (process.env.TESTS_REPORT_FILE) {
	config.reporter = 'xunit';

	// mocha doesn't have this option, it's for other runners (e.g. e2e tests)
	config._reporterOptions = {
		output: process.env.TESTS_REPORT_FILE,
	};

	// but mocha accept with form (like from cli) of this option
	// e.g. option=value,option2=value
	config['reporter-options'] = Object.keys(config._reporterOptions)
		.map(option => `${option}=${config._reporterOptions[option]}`)
		.join(',');
}

// eslint-disable-next-line import/no-default-export
export default config;
