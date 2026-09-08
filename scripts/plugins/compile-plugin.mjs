import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 A plugin is published as ESM only. Two bundles are produced:

 - `<name>.js`             the package entry point. Every dependency stays
                           external, so a bundler in the consuming project can
                           deduplicate them.
 - `<name>.standalone.js`  for use straight from a CDN. Everything except
                           `lightweight-charts` itself is inlined and the result
                           is minified, so the file can be imported on its own
                           with no install step. The entry point is left
                           unminified: whatever bundles it will minify it in turn.

 The bundler's own minifier is used, which mangles names and drops comments and
 dead code but keeps line breaks. That is deliberate: a dedicated minifier saves
 only a couple of hundred more bytes over the wire on a bundle this size.

 The output must stay byte-for-byte reproducible (fixed file names, no
 sourcemaps, no timestamps): `plugins:check-stale` compares a fresh build with
 the published one to find plugins that need a release after a toolkit change.
 */

/**
 * Builds a workspace plugin package into its `dist/` folder.
 *
 * Called from the package's own `compile.mjs`, which passes its copies of Vite
 * and dts-bundle-generator so that the versions pinned by the package are the
 * ones used. The entry file is `src/<name>.ts`, where `<name>` is the package
 * name without its scope and `lwc-plugin-` prefix.
 *
 * @param {string} packageModuleUrl - `import.meta.url` of the calling `compile.mjs`.
 * @param {{ build: Function, defineConfig: Function, generateDtsBundle: Function }} tools
 */
export async function compilePlugin(packageModuleUrl, { build, defineConfig, generateDtsBundle }) {
	const packageDir = dirname(fileURLToPath(packageModuleUrl));
	const pkg = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf-8'));
	const entryName = pkg.name.slice(pkg.name.indexOf('/') + 1).replace(/^lwc-plugin-/, '');
	const entryFile = resolve(packageDir, 'src', `${entryName}.ts`);

	const distDir = resolve(packageDir, 'dist');
	if (!existsSync(distDir)) {
		mkdirSync(distDir);
	}

	const buildConfig = standalone => defineConfig({
		root: packageDir,
		publicDir: false,
		build: {
			outDir: distDir,
			// Both passes write into the same folder, so neither may clear it.
			emptyOutDir: false,
			minify: standalone,
			copyPublicDir: false,
			lib: {
				entry: entryFile,
				formats: ['es'],
				fileName: standalone ? `${entryName}.standalone` : entryName,
			},
			rollupOptions: {
				external: standalone
					? ['lightweight-charts']
					: ['lightweight-charts', 'fancy-canvas'],
			},
		},
	});

	const startTime = Date.now();
	console.log('⚡️ Starting');

	console.log('Bundling the plugin...');
	// Sequential: the two passes share an output folder.
	await build(buildConfig(false));
	await build(buildConfig(true));

	console.log('Generating the typings files...');
	const typing = generateDtsBundle([
		{
			filePath: resolve(packageDir, 'typings', `${entryName}.d.ts`),
			libraries: {
				importedLibraries: ['lightweight-charts', 'fancy-canvas'],
				/*
				 The toolkit is a devDependency that the bundler inlines into the
				 plugin's own output, so its types have to be inlined into the
				 declarations to match. Listing it is not optional: with
				 `followSymlinks: false` below it counts as an external library, and
				 an external library in neither list is emitted as neither a
				 declaration nor an import, leaving a .d.ts that references types it
				 never declares.
				 */
				inlinedLibraries: ['@tradingview/lwc-toolkit'],
			},
		},
	], {
		preferredConfigPath: resolve(packageDir, 'tsconfig.json'),
		/*
		 dts-bundle-generator treats a dependency as an external library only when
		 its resolved path sits in node_modules, and it inlines anything else. A
		 linked dependency resolves outside node_modules, so without this the
		 library's entire public typings would be inlined into the bundle instead
		 of imported from it.
		 */
		followSymlinks: false,
	});
	writeFileSync(resolve(distDir, `${entryName}.d.ts`), typing.join('\n'), { encoding: 'utf-8' });

	console.log(`🎉 Done (${Date.now() - startTime}ms)`);
}
