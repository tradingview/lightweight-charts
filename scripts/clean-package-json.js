#!/usr/bin/env node

/**
 * This script does something like https://github.com/shashkovdanil/clean-publish does
 * but it seems that clean-publish isn't supported anymore
 * and we can't use it in CI
 * see https://github.com/tradingview/lightweight-charts/issues/474
 */

const path = require('path');
const fs = require('fs');

function main() {
	const packageJsonPath = path.resolve(__dirname, '..', 'package.json');

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf-8' }));

	delete packageJson.private;
	delete packageJson.engines;
	delete packageJson.devDependencies;
	delete packageJson.scripts;

	// unfortunately, it seems that for now it is impossible to put this line to package.json directly
	// because for some reason tests don't work with that flag
	// either mocha, ts-node or typescript does't want to work
	// so let's add this setting on pre-publish phase
	//
	// Disabling this because we are setting the 'cjs' version for the 'main' key of the package.json
	// thus the type shouldn't be module. When we drop support for cjs then we can re-enable this.
	// packageJson.type = 'module';

	fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', { encoding: 'utf-8' });
}

if (require.main === module) {
	main();
}
