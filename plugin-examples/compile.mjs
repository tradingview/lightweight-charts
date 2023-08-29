/* eslint-disable no-console */
import { dirname, resolve, basename, join, extname } from 'node:path';
import {
	existsSync,
	mkdirSync,
	readdirSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import { build, defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { generateDtsBundle } from 'dts-bundle-generator';

function findPluginFiles(folderPath, recursive) {
	const pathNames = readdirSync(folderPath);
	const matchingFiles = [];

	pathNames.forEach(pathName => {
		const fullPath = join(folderPath, pathName);
		const stats = statSync(fullPath);

		if (recursive && stats.isDirectory() && pathName === basename(fullPath)) {
			const innerFiles = findPluginFiles(fullPath, false);
			matchingFiles.push(...innerFiles);
		} else if (
			stats.isFile() &&
			pathName === `${basename(folderPath)}${extname(pathName)}`
		) {
			matchingFiles.push([fullPath, basename(folderPath)]);
		}
	});

	return matchingFiles;
}

function convertKebabToCamel(kebabCaseString) {
	const words = kebabCaseString.split('-');
	const camelCaseWords = words.map((word, index) => {
		if (index === 0) {
			return word.charAt(0).toUpperCase() + word.slice(1);
		}
		return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	});

	return camelCaseWords.join('');
}

const __filename = fileURLToPath(import.meta.url);
const currentDir = dirname(__filename);

const pluginsFolder = resolve(currentDir, 'src', 'plugins');
const pluginFiles = findPluginFiles(pluginsFolder, true);

const filesToBuild = pluginFiles.map(([filepath, exportName]) => {
	return {
		filepath,
		exportName,
		name: convertKebabToCamel(exportName),
	};
});

const compiledFolder = resolve(currentDir, 'compiled');
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
			outDir: `compiled/${exportName}`,
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

function buildPackageJson(exportName) {
	return {
		name: exportName,
		type: 'module',
		main: `./${exportName}.umd.cjs`,
		module: `./${exportName}.js`,
		exports: {
			'.': {
				import: `./${exportName}.js`,
				require: `./${exportName}.umd.cjs`,
				types: `./${exportName}.d.ts`,
			},
		},
	};
}

const compile = async () => {
	const startTime = Date.now().valueOf();
	console.log('⚡️ Starting');
	console.log('Bundling the plugins...');
	const promises = filesToBuild.map(file => {
		return build(buildConfig(file));
	});
	await Promise.all(promises);
	console.log('Generating the package.json files...');
	filesToBuild.forEach(file => {
		const packagePath = resolve(
			compiledFolder,
			file.exportName,
			'package.json'
		);
		const content = JSON.stringify(
			buildPackageJson(file.exportName),
			undefined,
			4
		);
		writeFileSync(packagePath, content, { encoding: 'utf-8' });
	});
	console.log('Generating the typings files...');
	filesToBuild.forEach(file => {
		try {
			const esModuleTyping = generateDtsBundle([
				{
					filePath: `./typings/plugins/${file.exportName}/${file.exportName}.d.ts`,
					// output: {
					// 	umdModuleName: file.name,
					// },
				},
			]);
			const typingFilePath = resolve(
				compiledFolder,
				file.exportName,
				`${file.exportName}.d.ts`
			);
			writeFileSync(typingFilePath, esModuleTyping.join('\n'), {
				encoding: 'utf-8',
			});
		} catch (e) {
			console.error('Error generating typings for: ', file.exportName);
		}
	});
	const endTime = Date.now().valueOf();
	console.log(`🎉 Done (${endTime - startTime}ms)`);
};

(async () => {
	await compile();
	process.exit(0);
})();
