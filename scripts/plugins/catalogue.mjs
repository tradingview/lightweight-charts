#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { buildCatalogueData, DEFAULT_REGISTRY } from './catalogue-data.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRepoRoot = path.resolve(__dirname, '../..');

async function main() {
	const { values } = parseArgs({
		options: {
			out: { type: 'string', short: 'o' },
			'repo-root': { type: 'string' },
			offline: { type: 'boolean' },
			help: { type: 'boolean', short: 'h' },
		},
	});

	if (values.help) {
		console.log(`
Usage: node scripts/plugins/catalogue.mjs [options]

Prints the plugin catalogue data the docs site is built from: every non-private
packages/lwc-plugin-* package, validated against the package contract, with the
version, peer range and publish date of its published release. A package that is
not on npm is listed under "unpublished" and gets no entry.

Invalid metadata, or a registry that cannot be reached, is an error: the docs
build must fail rather than ship a partial or unconfirmed catalogue.

Options:
  -o, --out <file>      Write the JSON to a file instead of stdout
  --repo-root <dir>     Repository to read the packages from (default: this one)
  --offline             Do not consult the registry; every package counts as unpublished
  -h, --help            Show this help message

Environment:
  LWC_CATALOGUE_REGISTRY   Registry URL (default: npm_config_registry, else ${DEFAULT_REGISTRY})
  LWC_CATALOGUE_OFFLINE    Same as --offline when set to 1; for local docs work without network.
                           Refused when CI is set: a deployed catalogue must be a confirmed one.
`);
		return;
	}

	const offline = Boolean(values.offline) || process.env.LWC_CATALOGUE_OFFLINE === '1';
	if (offline && process.env.CI) {
		throw new Error('Offline mode is not allowed in CI: the published state of every plugin must be confirmed.');
	}

	const data = await buildCatalogueData({
		repoRoot: values['repo-root'] ? path.resolve(process.cwd(), values['repo-root']) : defaultRepoRoot,
		registry: process.env.LWC_CATALOGUE_REGISTRY || process.env.npm_config_registry || DEFAULT_REGISTRY,
		offline,
		// Warnings go to stderr so that stdout stays valid JSON.
		log: { warn: message => console.error(`⚠️  ${message}`) },
	});

	const json = JSON.stringify(data, null, '\t');
	if (values.out) {
		fs.writeFileSync(path.resolve(process.cwd(), values.out), `${json}\n`);
	} else {
		process.stdout.write(`${json}\n`);
	}
	console.error(`Catalogue: ${data.plugins.length} published, ${data.unpublished.length} unpublished`);
}

main().catch(err => {
	console.error(`❌ ${err.message}`);
	process.exit(1);
});
