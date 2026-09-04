#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import semver from 'semver';
import { loadTargetPlugins, buildWorkspaceDependencies } from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

/**
 * Checks forward compatibility for a single plugin: its own typecheck and build
 * scripts, run against the workspace library.
 */
function checkPluginForwardCompat(plugin) {
	console.log(`\nChecking ${plugin.name}...`);
	for (const script of ['typecheck', 'build']) {
		if (!plugin.packageJson.scripts?.[script]) {
			throw new Error(`package.json has no '${script}' script`);
		}
		console.log(`  - Running ${script}...`);
		execSync(`pnpm run ${script}`, { cwd: plugin.dir, stdio: 'inherit' });
	}
	console.log(`  ✅ ${plugin.name} passed forward compatibility checks`);
}

/**
 * Checks forward compatibility:
 * Builds the workspace library, then typechecks and builds each plugin.
 */
function checkForwardCompat(plugins) {
	try {
		buildWorkspaceDependencies(repoRoot);
	} catch (err) {
		console.error(`❌ Failed to build the workspace library: ${err.message}`);
		process.exit(1);
	}

	console.log(`\n🔍 Typechecking and building ${plugins.length} plugin(s)...`);
	let failedCount = 0;

	for (const plugin of plugins) {
		try {
			checkPluginForwardCompat(plugin);
		} catch (err) {
			failedCount++;
			console.error(`  ❌ ${plugin.name} failed compatibility check: ${err.message}`);
		}
	}

	if (failedCount > 0) {
		console.error(`\n❌ Forward compatibility check failed: ${failedCount} of ${plugins.length} plugin(s) failed.`);
		process.exit(1);
	}

	console.log(`\n✨ All ${plugins.length} plugin(s) are forward-compatible with the workspace library!`);
	process.exit(0);
}

/**
 * Packs @tradingview/lwc-toolkit into a tarball. Installed from a tarball rather
 * than linked, the toolkit's own `lightweight-charts` import resolves to the
 * floor version installed in the temp project instead of the workspace copy.
 */
function packToolkitTarball(destDir) {
	execSync('pnpm --filter @tradingview/lwc-toolkit build', { cwd: repoRoot, stdio: 'inherit' });
	execSync(`pnpm pack --pack-destination "${destDir}"`, {
		cwd: path.join(repoRoot, 'packages/lwc-toolkit'),
		stdio: 'inherit',
	});
	const tgz = fs.readdirSync(destDir).find(f => f.endsWith('.tgz'));
	if (!tgz) {
		throw new Error('pnpm pack produced no tarball for @tradingview/lwc-toolkit');
	}
	return path.join(destDir, tgz);
}

/**
 * Sets up the isolated temp project for floor compatibility checking: the
 * plugin's sources and tsconfig, its dependencies, and the floor library version.
 */
function setupFloorProject(tempDir, plugin, floorVersion, toolkitTarballPath) {
	const tsconfigPath = path.join(plugin.dir, 'tsconfig.json');
	const tsVersion = plugin.packageJson.devDependencies?.typescript;
	if (!fs.existsSync(tsconfigPath) || !tsVersion) {
		throw new Error('a tsconfig.json and a typescript devDependency are required to typecheck the package');
	}
	fs.cpSync(path.join(plugin.dir, 'src'), path.join(tempDir, 'src'), { recursive: true });
	fs.copyFileSync(tsconfigPath, path.join(tempDir, 'tsconfig.json'));

	const dependencies = { 'lightweight-charts': floorVersion };
	for (const [dep, ver] of Object.entries(plugin.packageJson.dependencies || {})) {
		if (dep === '@tradingview/lwc-toolkit') {
			continue;
		}
		// npm cannot resolve workspace: specifiers outside the workspace.
		if (String(ver).startsWith('workspace:')) {
			console.warn(`  ⚠️ Skipping workspace dependency '${dep}' in the isolated floor check`);
			continue;
		}
		dependencies[dep] = ver;
	}

	const devDependencies = { typescript: tsVersion };
	const usesToolkit = Boolean(
		plugin.packageJson.devDependencies?.['@tradingview/lwc-toolkit'] ||
		plugin.packageJson.dependencies?.['@tradingview/lwc-toolkit']
	);
	if (usesToolkit) {
		devDependencies['@tradingview/lwc-toolkit'] = `file:${toolkitTarballPath}`;
	}

	fs.writeFileSync(
		path.join(tempDir, 'package.json'),
		JSON.stringify({
			name: 'floor-check-temp',
			private: true,
			type: 'module',
			dependencies,
			devDependencies,
		}, null, 2)
	);
}

/**
 * Verifies declared floor compatibility for a single plugin.
 */
function verifySinglePluginFloor(plugin, toolkitTarballPath) {
	console.log(`Testing declared floor for ${plugin.name}...`);
	const peerRange = plugin.packageJson.peerDependencies?.['lightweight-charts'];
	if (!peerRange) {
		throw new Error("No 'peerDependencies.lightweight-charts' declared");
	}

	const minVersionObj = semver.minVersion(peerRange);
	if (!minVersionObj) {
		throw new Error(`Could not determine minimum version from peer range '${peerRange}'`);
	}

	const floorVersion = minVersionObj.version;
	console.log(`  Declared peer range: '${peerRange}' -> floor version: ${floorVersion}`);

	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-floor-check-'));
	try {
		setupFloorProject(tempDir, plugin, floorVersion, toolkitTarballPath);

		console.log(`  Installing lightweight-charts@${floorVersion} in isolated environment...`);
		execSync('npm install --no-package-lock --no-audit', {
			cwd: tempDir,
			stdio: 'inherit',
		});

		console.log(`  Running typecheck against floor version...`);
		execSync('npx tsc --noEmit', {
			cwd: tempDir,
			stdio: 'inherit',
		});

		console.log(`  ✅ ${plugin.name} successfully verified against floor ${floorVersion}\n`);
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

/**
 * Checks floor compatibility:
 * For each plugin, installs its declared minimum peer version into an isolated temp project
 * and typechecks against it.
 */
function checkFloorCompat(plugins) {
	console.log(`🔍 Checking floor compatibility for ${plugins.length} plugin(s)...\n`);
	let failedCount = 0;

	const sharedTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-floor-shared-'));
	try {
		const toolkitTarballPath = packToolkitTarball(sharedTmpDir);
		for (const plugin of plugins) {
			try {
				verifySinglePluginFloor(plugin, toolkitTarballPath);
			} catch (err) {
				failedCount++;
				console.error(`  ❌ ${plugin.name} failed floor check: ${err.message}\n`);
			}
		}
	} catch (err) {
		console.error(`❌ Failed to prepare the toolkit tarball: ${err.message}`);
		process.exit(1);
	} finally {
		fs.rmSync(sharedTmpDir, { recursive: true, force: true });
	}

	if (failedCount > 0) {
		console.error(`❌ Floor compatibility check failed: ${failedCount} of ${plugins.length} plugin(s) failed.`);
		process.exit(1);
	}

	console.log(`✨ All ${plugins.length} plugin(s) passed floor compatibility verification!`);
	process.exit(0);
}

function main() {
	const { values } = parseArgs({
		options: {
			floor: { type: 'boolean' },
			filter: { type: 'string', short: 'f' },
			path: { type: 'string', short: 'p' },
			help: { type: 'boolean', short: 'h' },
		},
		allowPositionals: true,
	});

	if (values.help) {
		console.log(`
Usage: node scripts/plugins/check-compat.mjs [options]

Checks that every plugin builds against the workspace library, or with --floor
that it typechecks against its declared minimum lightweight-charts version.

Options:
  --floor               Verify declared minimum peer version against registry in isolated project
  -f, --filter <name>   Check only packages matching the name
  -p, --path <path>     Check a single package directory directly
  -h, --help            Show this help message
`);
		process.exit(0);
	}

	const targetPlugins = loadTargetPlugins(repoRoot, values);

	if (values.floor) {
		checkFloorCompat(targetPlugins);
	} else {
		checkForwardCompat(targetPlugins);
	}
}

main();
