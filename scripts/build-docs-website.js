#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const https = require('https');

const versions = require('../website/versions.json');

const websiteDir = path.resolve(__dirname, '../website');
const cacheDir = path.resolve(websiteDir, './.cache/');

function build() {
	return new Promise((resolve, reject) => {
		const child = childProcess.spawn('npm', ['run', 'build'], { cwd: websiteDir, shell: true });

		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);

		child.on('exit', resolve);
		child.on('error', reject);
	});
}

function createTsconfigForTypingsVersion(version) {
	return fsp.writeFile(
		path.resolve(cacheDir, `./tsconfig-${version}.json`),
		JSON.stringify({ files: [`./typings-${version}.d.ts`] }),
		{ encoding: 'utf8' }
	);
}

// TODO check cache
function downloadTypingsFromUnpkg(version) {
	const typingsFilePath = path.resolve(cacheDir, `./typings-${version}.d.ts`);
	if (fs.existsSync(typingsFilePath)) {
		return Promise.resolve();
	}

	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(typingsFilePath);
		const versionTypingsUrl = `https://unpkg.com/lightweight-charts@${version}/dist/typings.d.ts`;
		const request = https.get(versionTypingsUrl, response => {
			response.pipe(file);
		});

		file.on('finish', () => {
			file.close(resolve);
		});

		request.on('error', error => {
			reject(error);
		});
	});
}

// https://github.com/tgreyuk/typedoc-plugin-markdown/issues/143#issuecomment-979416052
// async function replaceSlugInApiIndexForVersion(version) {
// 	const filePath = path.resolve(websiteDir, `./versioned_docs/version-${version}/api/index.md`);
// 	const content = await fsp.readFile(filePath, 'utf8');
// 	const result = content.replace(/^slug:.+$/g, 'slug: "/api/"');
// 	await fsp.writeFile(filePath, result, 'utf8');
// }

async function main() {
	await Promise.all(versions.map(downloadTypingsFromUnpkg));
	await Promise.all(versions.map(createTsconfigForTypingsVersion));
	await build();
	// await fsp.rm(path.resolve(websiteDir, './docs/api/index.md'));
	// await Promise.all(versions.map(replaceSlugInApiIndexForVersion));
}

try {
	if (!fs.existsSync(cacheDir)) {
		fs.mkdirSync(cacheDir);
	}

	main().catch(e => {
		console.log(e);
		process.exit(1);
	});
} catch (e) {
	console.log(e);
	process.exit(1);
}
