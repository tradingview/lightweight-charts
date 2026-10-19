import fs from 'node:fs/promises';
import process from 'node:process';

/*
    Checks that the production property-rename transformer did not mangle
    host (browser) API accesses in the built bundles. Host APIs that are not in
    TypeScript's DOM lib must be declared in src/typings/dom-not-standarted,
    otherwise their property names are renamed and the feature silently
    stops working (see https://github.com/tradingview/lightweight-charts/issues/2146).
*/

const bundles = [
	'./dist/lightweight-charts.development.mjs',
	'./dist/lightweight-charts.production.mjs',
	'./dist/lightweight-charts.standalone.development.js',
	'./dist/lightweight-charts.standalone.production.js',
];

const hostAccesses = [
	{ name: 'scheduler.postTask(cb, { priority })', pattern: /\.scheduler\.postTask\(.{0,60}\{\s*priority\b/ },
	{ name: 'navigator.userAgentData', pattern: /\.userAgentData\b/ },
	{ name: 'UIEvent.sourceCapabilities', pattern: /\.sourceCapabilities\b/ },
];

async function checkBundles() {
	let failed = false;

	for (const bundle of bundles) {
		const content = await fs.readFile(bundle, 'utf-8');

		for (const { name, pattern } of hostAccesses) {
			if (!pattern.test(content)) {
				console.error(`Error: ${bundle} does not contain the host access "${name}". Its property names were probably renamed.`);
				failed = true;
			}
		}
	}

	process.exit(failed ? 1 : 0);
}

checkBundles().catch(error => {
	console.error('An error occurred:', error.message);
	process.exit(1);
});
