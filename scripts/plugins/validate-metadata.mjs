#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadTargetPlugins, validatePackageMetadata } from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

function main() {
	const { values } = parseArgs({
		options: {
			filter: { type: 'string', short: 'f' },
			path: { type: 'string', short: 'p' },
			help: { type: 'boolean', short: 'h' },
		},
		allowPositionals: true,
	});

	if (values.help) {
		console.log(`
Usage: node scripts/plugins/validate-metadata.mjs [options]

Validates plugin package.json contract and lwcPlugin metadata against JSON schema.

Options:
  -f, --filter <name>   Validate only packages matching the name
  -p, --path <path>     Validate a single package directory directly
  -h, --help            Show this help message
`);
		process.exit(0);
	}

	const targetPackages = loadTargetPlugins(repoRoot, values);

	console.log(`🔍 Validating metadata for ${targetPackages.length} package(s)...\n`);

	let failedCount = 0;

	for (const pkg of targetPackages) {
		console.log(`Checking ${pkg.name}...`);
		const result = validatePackageMetadata(pkg.dir, { isOfficial: true });

		if (result.valid) {
			console.log(`  ✅ Contract and metadata schema valid\n`);
		} else {
			failedCount++;
			console.error(`  ❌ Validation failed with ${result.errors.length} error(s):`);
			for (const err of result.errors) {
				console.error(`     - ${err}`);
			}
			console.error('');
		}
	}

	if (failedCount > 0) {
		console.error(`❌ Metadata validation failed: ${failedCount} of ${targetPackages.length} package(s) failed.`);
		process.exit(1);
	}

	console.log(`✨ All ${targetPackages.length} package(s) passed metadata validation!`);
	process.exit(0);
}

main();
