#!/usr/bin/env node

/**
 * This script does something like https://github.com/shashkovdanil/clean-publish does
 * but it seems that clean-publish isn't supported anymore
 * and we can't use it in CI
 * see https://github.com/tradingview/lightweight-charts/issues/474
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function main() {
	const packageJsonPath = path.resolve(__dirname, '..', 'package.json');

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf-8' }));

	delete packageJson.private;
	delete packageJson.engines;
	delete packageJson.devDependencies;
	delete packageJson.scripts;

	fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', { encoding: 'utf-8' });
}

main();
