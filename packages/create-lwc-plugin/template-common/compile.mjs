import { dirname, resolve } from 'node:path';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { build, defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { generateDtsBundle } from 'dts-bundle-generator';

function buildPackageJson(packageName) {
	/*
	 Define the contents of the package's package.json here.
	 */
	return {
		name: packageName,
		version: '1.0.0',
		keywords: ['lwc-plugin', 'lightweight-charts'],
		type: 'module',
		main: `./${packageName}.umd.cjs`,
		module: `./${packageName}.js`,
		types: `./${packageName}.d.ts`,
		exports: {
			import: {
				types: `./${packageName}.d.ts`,
				default: `./${packageName}.js`,
			},
			require: {
				types: `./${packageName}.d.cts`,
				default: `./${packageName}.umd.cjs`,
			},
		},
	};
}

const __filename = fileURLToPath(import.meta.url);
const currentDir = dirname(__filename);

const pluginFileName = 'template-entry';
const pluginFile = resolve(currentDir, 'src', `${pluginFileName}.ts`);

const pluginsToBuild = [
	{
		filepath: pluginFile,
		exportName: '_PACKAGENAME_',
		name: '_CLASSNAME_',
	},
];

const compiledFolder = resolve(currentDir, 'dist');
if (!existsSync(compiledFolder)) {
	mkdirSync(compiledFolder);
}

const buildConfig = ({
	filepath,
	name,
	exportName,
	formats = ['es', 'umd'],
}) => {
	return defineConfig({
		publicDir: false,
		build: {
			outDir: `dist`,
			emptyOutDir: true,
			copyPublicDir: false,
			lib: {
				entry: filepath,
				name,
				formats,
				fileName: exportName,
			},
			rollupOptions: {
				external: ['lightweight-charts', 'fancy-canvas'],
				output: {
					globals: {
						'lightweight-charts': 'LightweightCharts',
					},
				},
			},
		},
	});
};

const startTime = Date.now().valueOf();
console.log('⚡️ Starting');
console.log('Bundling the plugin...');
const promises = pluginsToBuild.map(file => {
	return build(buildConfig(file));
});
await Promise.all(promises);
console.log('Generating the package.json file...');
pluginsToBuild.forEach(file => {
	const packagePath = resolve(compiledFolder, 'package.json');
	const content = JSON.stringify(
		buildPackageJson(file.exportName),
		undefined,
		4
	);
	writeFileSync(packagePath, content, { encoding: 'utf-8' });
});
console.log('Generating the typings files...');
pluginsToBuild.forEach(file => {
	try {
		const esModuleTyping = generateDtsBundle([
			{
				filePath: `./typings/${pluginFileName}.d.ts`,
			},
		]);
		const typingFilePath = resolve(compiledFolder, `${file.exportName}.d.ts`);
		writeFileSync(typingFilePath, esModuleTyping.join('\n'), {
			encoding: 'utf-8',
		});
		copyFileSync(typingFilePath, resolve(compiledFolder, `${file.exportName}.d.cts`));
	} catch (e) {
		console.error('Error generating typings for: ', file.exportName);
	}
});
const endTime = Date.now().valueOf();
console.log(`🎉 Done (${endTime - startTime}ms)`);
