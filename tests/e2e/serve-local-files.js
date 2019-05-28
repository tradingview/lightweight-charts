#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const express = require('express');

function serveLocalFiles(filesToServe, port, hostname) {
	if (filesToServe.size === 0) {
		return Promise.resolve(null);
	}

	if (Array.from(filesToServe.values()).some(p => !fs.existsSync(p))) {
		return Promise.reject('Some of files does not exist');
	}

	const app = express();
	app.get('/:filename', (req, res) => {
		const requestedFile = filesToServe.get(req.params.filename);
		if (requestedFile === undefined) {
			res.sendStatus(404);
		} else {
			res.sendFile(requestedFile);
		}
	});

	return new Promise(resolve => {
		console.log(`Running a server on ${hostname}:${port} to serve ${filesToServe.size} local file(s)`);
		const server = app.listen(port, hostname, () => {
			resolve(() => {
				console.log('Stopping server...');
				server.close();
			});
		});
	});
}

module.exports.serveLocalFiles = serveLocalFiles;

function main() {
	if (process.argv.length < 3) {
		console.log(`Usage: ${process.argv[1]} [...paths]`);
		console.log(`Example: ${process.argv[1]} path/to/file renamed-file-name:path/to/file`);
		process.exit(1);
	}

	const portStr = process.env.SERVE_PORT;
	const port = portStr ? parseInt(portStr) : 34567;
	if (Number.isNaN(port)) {
		return Promise.reject(`Port must be a number, given ${portStr}`);
	}

	const filesToServe = new Map();
	for (let i = 2; i < process.argv.length; ++i) {
		let servedName;
		let filePath;

		const parts = process.argv[i].split(':');
		if (parts.length === 1) {
			filePath = parts[0];
			servedName = path.basename(filePath);
		} else {
			servedName = path.basename(parts[0]);
			filePath = parts[1];
		}

		if (filesToServe.has(servedName)) {
			return Promise.reject(`Multiple files with the same name "${servedName}" detected. Use renaming.`);
		}

		filesToServe.set(servedName, path.resolve(filePath));
	}

	return serveLocalFiles(filesToServe, port, '0.0.0.0');
}

if (require.main === module) {
	main().catch(e => {
		console.error('Error:', e);
		process.exitCode = 1;
	});
}
