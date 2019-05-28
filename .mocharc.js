'use strict';

// override tsconfig for tests
process.env.TS_NODE_PROJECT = './tests/unittests/tsconfig.json';

module.exports = {
	require: [
		'ts-node/register',
	],
	extension: ['ts'],
	checkLeaks: true,
	recursive: true,
	diff: true,
};
