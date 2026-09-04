#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import {
	loadTargetPlugins,
	buildWorkspaceDependencies,
	compareVersions,
	getRemoteVersion,
	verifyChangelog,
	verifyPackContent,
	validatePackageMetadata,
} from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

/**
 * Asks user for interactive confirmation.
 */
function askConfirmation(query) {
	return new Promise(resolve => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.question(query, answer => {
			rl.close();
			resolve(/^(y|yes)$/i.test(answer.trim()));
		});
	});
}

let workspaceBuilt = false;
let workspaceBuildError = null;

/**
 * Builds the library and the toolkit once per run, right before the first
 * plugin build needs them, so the script works on a clean checkout. A failed
 * build fails every remaining candidate without being retried.
 */
function ensureWorkspaceBuilt() {
	if (workspaceBuildError) {
		throw workspaceBuildError;
	}
	if (workspaceBuilt) {
		return;
	}
	try {
		buildWorkspaceDependencies(repoRoot);
		workspaceBuilt = true;
	} catch (err) {
		workspaceBuildError = new Error(`Workspace build failed: ${err.message}`);
		throw workspaceBuildError;
	}
}

/**
 * Runs the package contract and metadata checks, failing the package on errors.
 */
function validateMetadataOrThrow(plugin) {
	console.log(`  - Validating package metadata and schema...`);
	const metaResult = validatePackageMetadata(plugin.dir, { isOfficial: true });
	if (!metaResult.valid) {
		throw new Error(`Metadata validation errors: ${metaResult.errors.join('; ')}`);
	}
}

/**
 * Validates version and CHANGELOG entry for a plugin.
 */
function checkVersionAndChangelog(plugin) {
	const pkgName = plugin.name;
	const localVersion = plugin.version;

	console.log(`  - Checking remote version on npm...`);
	const remoteVersion = getRemoteVersion(pkgName);
	const { isNewer } = compareVersions(localVersion, remoteVersion);

	if (!isNewer) {
		console.log(`  ⏩ Skipped: Local version ${localVersion} is not newer than remote (${remoteVersion})`);
		return {
			isNewer: false,
			reason: `Up to date (remote: ${remoteVersion || 'none'})`,
		};
	}
	console.log(`  📌 Release candidate: local ${localVersion} > remote ${remoteVersion || 'none (new package)'}`);

	console.log(`  - Verifying CHANGELOG.md has entry for ${localVersion}...`);
	const changelogPath = path.join(plugin.dir, 'CHANGELOG.md');
	if (!fs.existsSync(changelogPath)) {
		throw new Error('CHANGELOG.md file is missing');
	}
	const changelogContent = fs.readFileSync(changelogPath, 'utf-8');
	const changelogResult = verifyChangelog(changelogContent, localVersion);
	if (!changelogResult.valid) {
		throw new Error(changelogResult.message);
	}
	console.log(`  ✅ CHANGELOG.md has entry for ${localVersion}`);

	return { isNewer: true };
}

/**
 * Builds and packages a plugin, verifying tarball contents.
 */
function buildAndPackPlugin(plugin, tempPackDir) {
	validateMetadataOrThrow(plugin);
	ensureWorkspaceBuilt();

	console.log(`  - Running clean build...`);
	const distDir = path.join(plugin.dir, 'dist');
	fs.rmSync(distDir, { recursive: true, force: true });
	execSync('pnpm run build', { cwd: plugin.dir, stdio: 'inherit' });

	console.log(`  - Packaging tarball with pnpm pack...`);
	execSync(`pnpm pack --pack-destination "${tempPackDir}"`, {
		cwd: plugin.dir,
		stdio: 'inherit',
	});

	const files = fs.readdirSync(tempPackDir);
	const tgzFile = files.find(f => f.endsWith('.tgz'));
	if (!tgzFile) {
		throw new Error('Tarball not found in pack destination');
	}
	const tarballPath = path.join(tempPackDir, tgzFile);

	console.log(`  - Verifying tarball contents...`);
	const packResult = verifyPackContent(tarballPath, plugin.packageJson);
	if (!packResult.valid) {
		throw new Error(`Tarball content errors: ${packResult.errors.join('; ')}`);
	}

	console.log(`  ✅ Content and metadata verified successfully`);
	return tarballPath;
}

/**
 * Publishes the verified tarball to npm with a prompt per package.
 */
async function publishTarball(plugin, tarballPath, isDryRun) {
	const pkgName = plugin.name;
	const localVersion = plugin.version;

	if (isDryRun) {
		console.log(`  🛡️  [DRY RUN] Would publish ${pkgName}@${localVersion}`);
		return { published: true, dryRun: true };
	}

	const confirmed = await askConfirmation(`\nPublish ${pkgName}@${localVersion} to npm? (y/N): `);
	if (!confirmed) {
		console.log(`  ⏩ Publish cancelled by maintainer`);
		return { published: false, reason: 'Cancelled by maintainer' };
	}

	console.log(`  🚀 Publishing ${tarballPath} to npm...`);
	// Security: publishes the exact verified tarball without --no-git-checks
	execSync(`pnpm publish "${tarballPath}" --access public`, {
		cwd: plugin.dir,
		stdio: 'inherit',
	});
	console.log(`  🎉 Successfully published ${pkgName}@${localVersion}`);
	return { published: true, dryRun: false };
}

/**
 * Processes a single plugin for release.
 */
async function processPlugin(plugin, { isDryRun, isCheckOnly }) {
	if (isCheckOnly) {
		// The PR gate: cheap, and every package is checked whether or not it is
		// about to be released.
		validateMetadataOrThrow(plugin);
	}

	const versionResult = checkVersionAndChangelog(plugin);
	if (!versionResult.isNewer) {
		return { status: 'skipped', reason: versionResult.reason };
	}

	if (isCheckOnly) {
		console.log(`  ✅ Metadata, changelog and version checks passed for ${plugin.name}@${plugin.version}`);
		return { status: 'checked', version: plugin.version };
	}

	const tempPackDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-pack-'));
	try {
		const tarballPath = buildAndPackPlugin(plugin, tempPackDir);
		const pubResult = await publishTarball(plugin, tarballPath, isDryRun);
		if (pubResult.published) {
			return { status: 'published', dryRun: pubResult.dryRun, version: plugin.version };
		}
		return { status: 'skipped', reason: pubResult.reason };
	} finally {
		fs.rmSync(tempPackDir, { recursive: true, force: true });
	}
}

/**
 * Prints final release report table.
 */
function printReleaseReport(published, skipped, failed, isCheckOnly) {
	console.log(`\n============================================================`);
	console.log(`                 PLUGIN RELEASE REPORT                      `);
	console.log(`============================================================`);

	if (isCheckOnly) {
		console.log(`\nChecked: ${published.length}`);
		for (const p of published) {
			console.log(`  ✅ ${p.name}@${p.version} (check-only)`);
		}
	} else {
		console.log(`\nPublished / To-Publish: ${published.length}`);
		for (const p of published) {
			console.log(`  ✅ ${p.name}@${p.version}${p.dryRun ? ' (dry-run)' : ''}`);
		}
	}

	console.log(`\nSkipped: ${skipped.length}`);
	for (const s of skipped) {
		console.log(`  ⏩ ${s.name} (${s.reason})`);
	}

	console.log(`\nFailed: ${failed.length}`);
	for (const f of failed) {
		console.log(`  ❌ ${f.name}@${f.version}: ${f.reason}`);
	}

	console.log(`============================================================\n`);
}

async function main() {
	const { values } = parseArgs({
		options: {
			'dry-run': { type: 'boolean' },
			'check-only': { type: 'boolean' },
			filter: { type: 'string', short: 'f' },
			path: { type: 'string', short: 'p' },
			help: { type: 'boolean', short: 'h' },
		},
		allowPositionals: true,
	});

	if (values.help) {
		console.log(`
Usage: node scripts/plugins/release.mjs [options]

Releases non-private workspace plugin packages to npm.

Options:
  --dry-run             Build, pack and verify every release candidate without publishing
  --check-only          Validate metadata and check version/CHANGELOG only, without building or packing
  -f, --filter <name>   Target only packages matching the name
  -p, --path <path>     Target a single package directory directly
  -h, --help            Show this help message
`);
		process.exit(0);
	}

	const isDryRun = Boolean(values['dry-run']);
	const isCheckOnly = Boolean(values['check-only']);

	// Publishing is a manual, local step: CI never holds npm credentials.
	if (!isDryRun && !isCheckOnly && process.env.CI) {
		console.error('❌ Error: Publishing from CI is not allowed.');
		console.error('Releases must be executed locally by an authorized maintainer.');
		process.exit(1);
	}

	if (isDryRun) {
		console.log('🛡️  Running in DRY-RUN mode (publishing disabled, no credentials needed).\n');
	}

	const targetPlugins = loadTargetPlugins(repoRoot, values);
	const published = [];
	const skipped = [];
	const failed = [];

	for (const plugin of targetPlugins) {
		console.log(`\n------------------------------------------------------------`);
		console.log(`Processing ${plugin.name} (v${plugin.version})...`);

		try {
			const result = await processPlugin(plugin, { isDryRun, isCheckOnly });
			if (result.status === 'published' || result.status === 'checked') {
				published.push({ name: plugin.name, version: result.version, dryRun: isDryRun });
			} else {
				skipped.push({ name: plugin.name, version: plugin.version, reason: result.reason });
			}
		} catch (err) {
			// One package's failure does not stop the batch.
			console.error(`  ❌ Failed: ${err.message}`);
			failed.push({
				name: plugin.name,
				version: plugin.version,
				reason: err.message,
			});
		}
	}

	printReleaseReport(published, skipped, failed, isCheckOnly);

	if (failed.length > 0) {
		process.exit(1);
	}
	process.exit(0);
}

main().catch(err => {
	console.error(`Unexpected release script error: ${err.message}`);
	process.exit(1);
});
