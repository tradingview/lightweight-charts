#!/usr/bin/env node

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const https = require('https');

const versions = require('../website/versions.json');

const websiteDir = path.resolve(__dirname, '../website');
const cacheDir = path.resolve(websiteDir, './.cache/');

function downloadTypingsToFile(typingsFilePath, version) {
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

async function downloadTypingsFromUnpkg(version) {
	const typingsFilePath = path.resolve(cacheDir, `./typings-${version}.d.ts`);

	try {
		await fsp.stat(typingsFilePath);
	} catch (e) {
		if (e.code === 'ENOENT') {
			return downloadTypingsToFile(typingsFilePath, version);
		}

		throw e;
	}
}

async function main() {
	await Promise.all(versions.map(downloadTypingsFromUnpkg));
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
