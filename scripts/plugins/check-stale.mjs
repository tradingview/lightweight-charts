#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import {
	loadTargetPlugins,
	buildWorkspaceDependencies,
	getRemoteVersion,
	compareVersions,
	fetchPublishedPackage,
	compareDistDirs,
	classifyStaleness,
} from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

/**
 * Rebuilds one plugin against the workspace toolkit and compares its `dist/`
 * with the version published on npm.
 *
 * @returns {{ status: 'pass' | 'warn' | 'fail', message: string }}
 */
function checkPlugin(plugin, remoteVersion) {
	console.log(`\nChecking ${plugin.name} (local ${plugin.version}, published ${remoteVersion})...`);

	if (!plugin.packageJson.scripts?.build) {
		throw new Error(`package.json has no 'build' script`);
	}
	console.log(`  - Building against the workspace toolkit...`);
	const distDir = path.join(plugin.dir, 'dist');
	fs.rmSync(distDir, { recursive: true, force: true });
	execSync('pnpm run build', { cwd: plugin.dir, stdio: 'inherit' });

	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-stale-'));
	try {
		console.log(`  - Fetching published ${plugin.name}@${remoteVersion}...`);
		const publishedDir = fetchPublishedPackage(plugin.name, remoteVersion, tempDir);
		const diff = compareDistDirs(distDir, path.join(publishedDir, 'dist'));
		const { isNewer } = compareVersions(plugin.version, remoteVersion);
		const result = classifyStaleness({ outputDiffers: !diff.identical, versionBumped: isNewer });

		for (const file of diff.changed) {
			console.log(`    ~ dist/${file}`);
		}
		for (const file of diff.added) {
			console.log(`    + dist/${file}`);
		}
		for (const file of diff.removed) {
			console.log(`    - dist/${file}`);
		}

		const icon = { pass: '✅', warn: '⚠️ ', fail: '❌' }[result.status];
		console.log(`  ${icon} ${plugin.name}: ${result.message}`);
		return result;
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

/**
 * Asks the registry which targets are published at all; unpublished ones have
 * nothing to compare against and are reported here.
 *
 * @returns {{ published: Array<{ plugin: object, remoteVersion: string }>, errorCount: number }}
 */
function collectPublished(plugins) {
	const published = [];
	let errorCount = 0;
	for (const plugin of plugins) {
		try {
			const remoteVersion = getRemoteVersion(plugin.name);
			if (remoteVersion === null) {
				console.log(`⏩ ${plugin.name}: never published, nothing to compare against`);
			} else {
				published.push({ plugin, remoteVersion });
			}
		} catch (err) {
			errorCount++;
			console.error(`❌ ${plugin.name}: ${err.message}`);
		}
	}
	return { published, errorCount };
}

function printSummary(stale, warnings, errorCount) {
	console.log('');
	if (warnings.length > 0) {
		console.log(`⚠️  Version bumped without output changes: ${warnings.join(', ')}`);
	}
	if (stale.length > 0) {
		console.error(`❌ Plugins that need a version bump and a CHANGELOG entry: ${stale.join(', ')}`);
	}
	if (errorCount > 0) {
		console.error(`❌ ${errorCount} plugin(s) could not be checked.`);
	}
}

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
Usage: node scripts/plugins/check-stale.mjs [options]

Finds plugins whose shipped output changed without a version bump. Every
published plugin is rebuilt against the workspace toolkit and its dist/ is
compared byte for byte with the version on npm. Plugins bundle the toolkit, so
a toolkit change reaches users only through a release of each affected plugin.

Per plugin:
  output differs, version not bumped   fail
  output differs, version bumped       pass (plugins:release will publish it)
  output identical, version bumped     warn (README or metadata-only release)
  never published                      skipped

Options:
  -f, --filter <name>   Check only packages matching the name
  -p, --path <path>     Check a single package directory directly
  -h, --help            Show this help message
`);
		process.exit(0);
	}

	const targetPlugins = loadTargetPlugins(repoRoot, values);
	const stale = [];
	const warnings = [];

	// Ask the registry first: nothing needs building when no target is published.
	const { published, errorCount: lookupErrors } = collectPublished(targetPlugins);
	let errorCount = lookupErrors;

	if (published.length > 0) {
		try {
			buildWorkspaceDependencies(repoRoot);
		} catch (err) {
			console.error(`❌ Failed to build the workspace library: ${err.message}`);
			process.exit(1);
		}
	}

	for (const { plugin, remoteVersion } of published) {
		try {
			const result = checkPlugin(plugin, remoteVersion);
			if (result.status === 'fail') {
				stale.push(plugin.name);
			} else if (result.status === 'warn') {
				warnings.push(plugin.name);
			}
		} catch (err) {
			errorCount++;
			console.error(`  ❌ ${plugin.name}: ${err.message}`);
		}
	}

	printSummary(stale, warnings, errorCount);
	if (stale.length > 0 || errorCount > 0) {
		process.exit(1);
	}

	console.log(`✨ No stale plugin packages among ${targetPlugins.length} checked.`);
	process.exit(0);
}

main();
