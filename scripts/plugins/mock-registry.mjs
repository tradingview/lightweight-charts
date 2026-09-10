#!/usr/bin/env node

/*
 A stand-in npm registry for previewing the plugin catalogue before the
 packages are published.

 `scripts/plugins/catalogue.mjs` only lists a plugin the registry knows about,
 so with nothing published the catalogue pages come out empty. This serves
 exactly what the catalogue asks for — a packument per package and the tarball
 it names, with the integrity the catalogue verifies — built from the workspace
 packages themselves, so the pages show the release that is about to go out.

   pnpm plugins:mock-registry                 # packs, then serves on :4873
   LWC_CATALOGUE_REGISTRY=http://localhost:4873 pnpm --filter lightweight-charts-website start

 Never point anything that installs at this: it publishes nothing, checks
 nothing, and answers 404 for every package it was not given.
 */

import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadTargetPlugins } from './utils.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_PORT = 4873;
/** Fixed, so the same package always reports the same publish date. */
const PUBLISHED_AT = '2026-01-01T00:00:00.000Z';

/** Packs each plugin into `dir` and reads back the manifest npm would publish. */
function packPlugins(plugins, dir) {
	const packages = new Map();
	for (const plugin of plugins) {
		execFileSync('pnpm', ['pack', '--pack-destination', dir], {
			cwd: plugin.dir,
			stdio: ['pipe', 'pipe', 'inherit'],
		});
		// `pnpm pack` names the file after the package and version.
		const unscoped = plugin.name.replace('@', '').replace('/', '-');
		const file = `${unscoped}-${plugin.version}.tgz`;
		const tarball = path.join(dir, file);
		if (!fs.existsSync(tarball)) {
			throw new Error(`pnpm pack produced no ${file} for ${plugin.name}`);
		}
		const buffer = fs.readFileSync(tarball);
		const manifest = JSON.parse(
			execFileSync('tar', ['-xzOf', tarball, 'package/package.json'], { encoding: 'utf-8' })
		);
		packages.set(manifest.name, { file, buffer, manifest });
		console.log(`  📦 ${manifest.name}@${manifest.version}`);
	}
	return packages;
}

/** The packument the catalogue reads: one version, tagged latest, with its tarball. */
function packument(name, entry, port) {
	const { manifest, buffer, file } = entry;
	return {
		name,
		'dist-tags': { latest: manifest.version },
		time: { [manifest.version]: PUBLISHED_AT },
		versions: {
			[manifest.version]: {
				...manifest,
				dist: {
					tarball: `http://localhost:${port}/${name}/-/${file}`,
					integrity: `sha512-${createHash('sha512').update(buffer).digest('base64')}`,
				},
			},
		},
	};
}

function main() {
	const { values } = parseArgs({
		options: {
			port: { type: 'string' },
			filter: { type: 'string', short: 'f' },
			path: { type: 'string', short: 'p' },
			help: { type: 'boolean', short: 'h' },
		},
		allowPositionals: true,
	});

	if (values.help) {
		console.log(`
Usage: node scripts/plugins/mock-registry.mjs [options]

Packs the workspace plugin packages and serves them as an npm registry, so the
documentation site can build its plugin catalogue before anything is published.

Options:
      --port <port>     Port to listen on (default ${DEFAULT_PORT})
  -f, --filter <name>   Serve only packages matching the name
  -p, --path <path>     Serve a single package directory
  -h, --help            Show this help message
`);
		process.exit(0);
	}

	const port = Number(values.port ?? DEFAULT_PORT);
	const plugins = loadTargetPlugins(repoRoot, values);
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-mock-registry-'));
	console.log(`📦 Packing ${plugins.length} package(s)...`);
	const packages = packPlugins(plugins, dir);

	const server = http.createServer((request, response) => {
		const url = decodeURIComponent((request.url ?? '').split('?')[0]);
		const tarball = [...packages.values()].find(entry => url.endsWith(`/${entry.file}`));
		if (tarball) {
			response.writeHead(200, { 'content-type': 'application/octet-stream' });
			response.end(tarball.buffer);
			return;
		}
		// The catalogue percent-encodes the scope separator, as npm clients do.
		const name = url.replace(/^\//, '').replace('%2F', '/');
		const entry = packages.get(name);
		if (!entry) {
			response.writeHead(404, { 'content-type': 'application/json' });
			response.end('{"error":"Not found"}');
			return;
		}
		response.writeHead(200, { 'content-type': 'application/json' });
		response.end(JSON.stringify(packument(name, entry, port)));
	});

	server.listen(port, () => {
		console.log(`\n✨ Mock registry on http://localhost:${port}\n`);
		console.log('Build or serve the site against it with:');
		console.log(`  LWC_CATALOGUE_REGISTRY=http://localhost:${port} pnpm --filter lightweight-charts-website start\n`);
		console.log('Press Ctrl+C to stop.');
	});

	const stop = () => {
		server.close();
		fs.rmSync(dir, { recursive: true, force: true });
		process.exit(0);
	};
	process.on('SIGINT', stop);
	process.on('SIGTERM', stop);
}

main();
