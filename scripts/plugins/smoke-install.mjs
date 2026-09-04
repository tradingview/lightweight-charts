#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync, execSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import semver from 'semver';
import { loadTargetPlugins, buildWorkspaceDependencies, extractReadmeSnippet } from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

/**
 * Resolves the lightweight-charts dependency version or tarball path.
 */
function resolveLwcDependency(peerRange, lwcTarballOption) {
	if (lwcTarballOption) {
		const absolutePath = path.resolve(process.cwd(), lwcTarballOption);
		return `file:${absolutePath}`;
	}

	const range = peerRange || 'latest';
	try {
		const stdout = execFileSync('npm', ['view', `lightweight-charts@${range}`, 'version', '--json'], {
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		}).trim();
		const parsed = JSON.parse(stdout);
		if (Array.isArray(parsed)) {
			return semver.maxSatisfying(parsed, range) || parsed[parsed.length - 1];
		}
		return typeof parsed === 'string' ? parsed : range;
	} catch (e) {
		console.warn(`⚠️ Warning: Failed to query registry for lightweight-charts@${range}: ${e.message}`);
		return range;
	}
}

let workspaceBuilt = false;
let workspaceBuildError = null;

/**
 * Plugin builds resolve the library and the toolkit through workspace links
 * whose entry points live in `dist/`; build both once, before the first plugin.
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
 * Packs a plugin and ensures its declared dependencies do not leak other plugin packages.
 */
function packAndCheckPlugin(plugin, pluginTmpDir) {
	if (!plugin.packageJson.scripts?.build) {
		throw new Error(`package.json has no 'build' script`);
	}
	ensureWorkspaceBuilt();
	console.log(`  - Building ${plugin.name}...`);
	execSync('pnpm run build', { cwd: plugin.dir, stdio: 'inherit' });

	console.log(`  - Packaging ${plugin.name}...`);
	execSync(`pnpm pack --pack-destination "${pluginTmpDir}"`, {
		cwd: plugin.dir,
		stdio: 'inherit',
	});

	const files = fs.readdirSync(pluginTmpDir);
	const pluginTgz = files.find(f => f.endsWith('.tgz'));
	if (!pluginTgz) {
		throw new Error(`Failed to create tarball for ${plugin.name}`);
	}

	// Check that the plugin does not depend on other plugin packages
	const ownPackageName = plugin.name;
	const checkDeps = deps => {
		if (!deps || typeof deps !== 'object') {
			return;
		}
		for (const dep of Object.keys(deps)) {
			if (dep !== ownPackageName && dep.includes('lwc-plugin-')) {
				throw new Error(`Package isolation violation: declares dependency on other plugin '${dep}'`);
			}
		}
	};
	checkDeps(plugin.packageJson.dependencies);
	checkDeps(plugin.packageJson.peerDependencies);

	return path.join(pluginTmpDir, pluginTgz);
}

/**
 * Sets up temporary Vite consumer project files.
 */
function setupViteConsumerProject(projectDir, { pluginName, pluginTarballPath, lwcDep, snippet, entryFileName }) {
	const vitePkg = {
		name: 'smoke-vite-consumer',
		private: true,
		type: 'module',
		dependencies: {
			'lightweight-charts': lwcDep,
			[pluginName]: `file:${pluginTarballPath}`,
		},
		devDependencies: {
			vite: '~8.2.2',
		},
	};

	fs.writeFileSync(
		path.join(projectDir, 'package.json'),
		JSON.stringify(vitePkg, null, 2)
	);

	fs.writeFileSync(
		path.join(projectDir, entryFileName),
		`// Generated smoke test entry\n${snippet}\n`
	);

	const viteConfig = `
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    minify: false,
    rollupOptions: {
      input: '${entryFileName}',
      external: ['lightweight-charts'],
      output: {
        entryFileNames: 'bundle.js',
        format: 'es',
      },
    },
  },
});
`;
	fs.writeFileSync(path.join(projectDir, 'vite.config.js'), viteConfig);
}

/**
 * Asserts bundle isolation.
 */
function assertBundleIsolation(bundleContent, pluginName) {
	// 1. Must NOT inline lightweight-charts library (the string 'tv-lightweight-charts' survives minification)
	if (bundleContent.includes('tv-lightweight-charts')) {
		throw new Error(
			"Bundle isolation failure: 'tv-lightweight-charts' marker found in bundle — lightweight-charts was inlined"
		);
	}

	const hasExternalLwcImport =
		bundleContent.includes('from"lightweight-charts"') ||
		bundleContent.includes("from'lightweight-charts'") ||
		bundleContent.includes('from "lightweight-charts"') ||
		bundleContent.includes("from 'lightweight-charts'");

	if (!hasExternalLwcImport) {
		throw new Error('Bundle isolation failure: lightweight-charts is not referenced as an external dependency');
	}

	// 2. Must not contain code/names from other plugins
	const ownUnscopedName = pluginName.replace(/^@tradingview\//, '');
	const pluginMatches = bundleContent.match(/lwc-plugin-[\w-]+/g) || [];
	for (const match of pluginMatches) {
		if (match !== ownUnscopedName && !match.startsWith(`${ownUnscopedName}-`)) {
			throw new Error(`Bundle isolation failure: found foreign plugin reference '${match}' in bundle`);
		}
	}

	// 3. Must bundle plugin's own code (not leave it as external import)
	const hasUnbundledPluginImport =
		bundleContent.includes(`from "${pluginName}"`) ||
		bundleContent.includes(`from '${pluginName}'`);

	if (hasUnbundledPluginImport || bundleContent.length < 50) {
		throw new Error('Bundle isolation failure: plugin code was not bundled into the output');
	}

	console.log(`  ✅ Bundle isolation verified: plugin bundled, library external, no inlined library or foreign plugins`);
}

/**
 * Runs smoke installation and build test for a single plugin.
 */
function testSinglePluginSmoke(plugin, lwcTarballOption) {
	console.log(`Testing plugin: ${plugin.name}@${plugin.version}...`);
	const pluginTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-smoke-plugin-'));

	try {
		const pluginTarballPath = packAndCheckPlugin(plugin, pluginTmpDir);
		console.log(`  ✅ Packed plugin: ${pluginTarballPath}`);

		const peerRange = plugin.packageJson.peerDependencies?.['lightweight-charts'];
		const lwcDep = resolveLwcDependency(peerRange, lwcTarballOption);
		console.log(`  - Target lightweight-charts dependency: ${lwcDep}`);

		const { code: snippet, lang } = extractReadmeSnippet(path.join(plugin.dir, 'README.md'));
		if (!snippet) {
			throw new Error('README.md has no JavaScript/TypeScript integration snippet to compile');
		}
		const entryFileName = `main.${lang}`;

		const viteProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-vite-app-'));
		try {
			console.log(`  - Creating temporary Vite project with entry ${entryFileName}...`);
			setupViteConsumerProject(viteProjectDir, {
				pluginName: plugin.name,
				pluginTarballPath,
				lwcDep,
				snippet,
				entryFileName,
			});

			console.log(`  - Installing dependencies into Vite project...`);
			execSync('npm install --no-package-lock --no-audit', {
				cwd: viteProjectDir,
				stdio: 'inherit',
			});

			console.log(`  - Compiling integration snippet with Vite...`);
			execSync('npx vite build', {
				cwd: viteProjectDir,
				stdio: 'inherit',
			});

			console.log(`  - Asserting bundle contents and isolation...`);
			const bundlePath = path.join(viteProjectDir, 'dist/bundle.js');
			if (!fs.existsSync(bundlePath)) {
				throw new Error(`Expected bundle at ${bundlePath} was not created`);
			}

			const bundleContent = fs.readFileSync(bundlePath, 'utf-8');
			assertBundleIsolation(bundleContent, plugin.name);
		} finally {
			fs.rmSync(viteProjectDir, { recursive: true, force: true });
		}
	} finally {
		fs.rmSync(pluginTmpDir, { recursive: true, force: true });
	}
}

function main() {
	const { values } = parseArgs({
		options: {
			filter: { type: 'string', short: 'f' },
			path: { type: 'string', short: 'p' },
			'lwc-tarball': { type: 'string' },
			help: { type: 'boolean', short: 'h' },
		},
		allowPositionals: true,
	});

	if (values.help) {
		console.log(`
Usage: node scripts/plugins/smoke-install.mjs [options]

Smoke tests plugin packaging, Vite integration, and bundle isolation.

Options:
  -f, --filter <name>     Target only packages matching the name
  -p, --path <path>       Target a specific package directory directly
  --lwc-tarball <path>    Install this lightweight-charts .tgz instead of the registry version.
                          Pack it with "pnpm prepare-package-json-for-release && pnpm pack", so
                          the consumer install does not run the repository's own scripts.
  -h, --help              Show this help message
`);
		process.exit(0);
	}

	const targetPlugins = loadTargetPlugins(repoRoot, values);
	console.log(`🚀 Starting smoke-install test for ${targetPlugins.length} package(s)...\n`);

	let failedCount = 0;
	for (const plugin of targetPlugins) {
		try {
			testSinglePluginSmoke(plugin, values['lwc-tarball']);
		} catch (err) {
			failedCount++;
			console.error(`  ❌ Smoke test failed for ${plugin.name}: ${err.message}\n`);
		}
	}

	if (failedCount > 0) {
		console.error(`❌ Smoke install failed: ${failedCount} of ${targetPlugins.length} package(s) failed.`);
		process.exit(1);
	}

	console.log(`✨ All ${targetPlugins.length} package(s) passed smoke-install testing!`);
	process.exit(0);
}

main();
