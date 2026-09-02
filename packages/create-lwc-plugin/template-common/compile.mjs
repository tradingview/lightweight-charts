import { dirname, resolve } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { build, defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { generateDtsBundle } from 'dts-bundle-generator';

const __filename = fileURLToPath(import.meta.url);
const currentDir = dirname(__filename);

const pluginFileName = 'template-entry';
const pluginFile = resolve(currentDir, 'src', `${pluginFileName}.ts`);

const pluginsToBuild = [
	{
		filepath: pluginFile,
		exportName: 'template-entry',
	},
];

const compiledFolder = resolve(currentDir, 'dist');
if (!existsSync(compiledFolder)) {
	mkdirSync(compiledFolder);
}

/*
 The plugin is published as ESM only. Two bundles are produced:

 - `<name>.js`         the package entry point. Every dependency stays external,
                       so a bundler in the consuming project can deduplicate them.
 - `<name>.standalone.js`  for use straight from a CDN. Everything except
                       `lightweight-charts` itself is inlined and the result is
                       minified, so the file can be imported on its own with no
                       install step. The entry point is left unminified: whatever
                       bundles it will minify it in turn.

 The bundler's own minifier is used, which mangles names and drops comments and
 dead code but keeps line breaks. That is deliberate: a dedicated minifier saves
 only a couple of hundred more bytes over the wire on a bundle this size, and is
 not worth an extra dependency in every plugin project.
 */
const buildConfig = ({ filepath, exportName, standalone = false }) => {
	return defineConfig({
		publicDir: false,
		build: {
			outDir: 'dist',
			// Both passes write into the same folder, so only the first may clear it.
			emptyOutDir: false,
			minify: standalone,
			copyPublicDir: false,
			lib: {
				entry: filepath,
				formats: ['es'],
				fileName: standalone ? `${exportName}.standalone` : exportName,
			},
			rollupOptions: {
				external: standalone
					? ['lightweight-charts']
					: ['lightweight-charts', 'fancy-canvas'],
			},
		},
	});
};

const startTime = Date.now().valueOf();
console.log('⚡️ Starting');

console.log('Bundling the plugin...');
for (const file of pluginsToBuild) {
	// Sequential: the two passes share an output folder.
	await build(buildConfig({ ...file, standalone: false }));
	await build(buildConfig({ ...file, standalone: true }));
}

console.log('Generating the typings files...');
for (const file of pluginsToBuild) {
	const esModuleTyping = generateDtsBundle([
		{
			filePath: `./typings/${pluginFileName}.d.ts`,
			libraries: {
				importedLibraries: ['lightweight-charts', 'fancy-canvas'],
			},
		},
	], {
		/*
		 dts-bundle-generator treats a dependency as an external library only when
		 its resolved path sits in node_modules, and it inlines anything else. A
		 linked dependency resolves outside node_modules, so without this the
		 library's entire public typings would be inlined into the bundle instead
		 of imported from it.
		 */
		followSymlinks: false,
	});
	const typingFilePath = resolve(compiledFolder, `${file.exportName}.d.ts`);
	writeFileSync(typingFilePath, esModuleTyping.join('\n'), {
		encoding: 'utf-8',
	});
}

const endTime = Date.now().valueOf();
console.log(`🎉 Done (${endTime - startTime}ms)`);
