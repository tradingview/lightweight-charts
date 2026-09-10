#!/usr/bin/env node

/*
 Builds the two HTML pages every workspace plugin package owns into the
 website's static folder, so that the documentation site can frame them:

   lwcPlugin.demo    -> website/static/plugin-demos/<slug>/     (/plugin-demos/<slug>/)
   lwcPlugin.preview -> website/static/plugin-previews/<slug>/   (/plugin-previews/<slug>/)

 The pages live outside `plugin-examples/src`, so the gallery's own Vite build
 never sees them; this script is what builds them. Both output folders are
 gitignored and are served as plain static files by `docusaurus build` and
 `docusaurus start` alike, which is why the website's own build runs this first.

 Each page is built with the Vite the package pins, the way `compile-plugin.mjs`
 uses the package's own copy, and with `base: './'` so the bundle works from the
 nested folder it is deployed to.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { loadTargetPlugins } from './utils.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const staticDir = path.join(repoRoot, 'website', 'static');

/** Where each declared page is deployed, by `lwcPlugin` field. */
const outputs = {
	demo: 'plugin-demos',
	preview: 'plugin-previews',
};

/** Unscoped package name without the `lwc-plugin-` prefix: the catalogue's URL segment. */
function slugOf(packageName) {
	return packageName.slice(packageName.indexOf('/') + 1).replace(/^lwc-plugin-/, '');
}

/**
 * The Vite the package pins, so a page is built with the same version that
 * builds the package itself.
 */
async function loadVite(packageDir) {
	const require = createRequire(path.join(packageDir, 'package.json'));
	return import(pathToFileURL(require.resolve('vite')).href);
}

/**
 * The pages import `lightweight-charts` and the toolkit through their package
 * exports, which point at built output. The library is a long build and belongs
 * to the caller; the two workspace helper packages are `tsc` only, so they are
 * rebuilt here — which is what makes this work on a fresh checkout, and keeps a
 * stale toolkit out of the deployed pages.
 */
function buildDependencies() {
	if (!fs.existsSync(path.join(repoRoot, 'dist', 'lightweight-charts.production.mjs'))) {
		throw new Error('The library is not built. Run `pnpm build` (or `pnpm build:prod`) first.');
	}
	console.log('📦 Building @tradingview/lwc-toolkit and @tradingview/lwc-plugin-preview-kit...');
	execFileSync(
		'pnpm',
		[
			'--filter', '@tradingview/lwc-toolkit',
			'--filter', '@tradingview/lwc-plugin-preview-kit',
			'build',
		],
		{ cwd: repoRoot, stdio: 'inherit' }
	);
}

/**
 * Builds one page of one package into `outDir`. The page's own folder is the
 * Vite root, and the emitted HTML is renamed to `index.html` so that the
 * deployed folder is addressable without a file name.
 */
async function buildPage(vite, packageDir, page, outDir) {
	const entry = path.resolve(packageDir, page);
	if (!fs.existsSync(entry)) {
		throw new Error(`Declared page '${page}' does not exist in ${packageDir}`);
	}
	await vite.build({
		root: path.dirname(entry),
		// Deployed under a nested path, so every asset reference is relative.
		base: './',
		publicDir: false,
		logLevel: 'warn',
		build: {
			outDir,
			// Outside the Vite root, so emptying it has to be asked for.
			emptyOutDir: true,
			rollupOptions: { input: { main: entry } },
		},
	});
	const emitted = path.join(outDir, path.basename(entry));
	const index = path.join(outDir, 'index.html');
	if (emitted !== index) {
		fs.renameSync(emitted, index);
	}
}

async function main() {
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
Usage: node scripts/plugins/build-demos.mjs [options]

Builds each workspace plugin's lwcPlugin.demo and lwcPlugin.preview pages into
website/static/plugin-demos/<slug>/ and website/static/plugin-previews/<slug>/.

Options:
  -f, --filter <name>   Build only packages matching the name
  -p, --path <path>     Build a single package directory directly
  -h, --help            Show this help message
`);
		process.exit(0);
	}

	const plugins = loadTargetPlugins(repoRoot, values);
	buildDependencies();
	console.log(`🏗  Building demo and preview pages for ${plugins.length} package(s)...\n`);

	const built = [];
	for (const plugin of plugins) {
		const slug = slugOf(plugin.name);
		const vite = await loadVite(plugin.dir);
		for (const [field, folder] of Object.entries(outputs)) {
			const page = plugin.packageJson.lwcPlugin?.[field];
			if (typeof page !== 'string') {
				continue;
			}
			const outDir = path.join(staticDir, folder, slug);
			await buildPage(vite, plugin.dir, page, outDir);
			built.push(`/${folder}/${slug}/`);
			console.log(`  ✅ ${plugin.name} ${field} → /${folder}/${slug}/`);
		}
	}

	console.log(`\n✨ Built ${built.length} page(s) into website/static.`);
}

main().catch(error => {
	console.error(`❌ ${error.message}`);
	process.exit(1);
});
