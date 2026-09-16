#!/usr/bin/env node

/*
 Serves `website/build` the way GitHub Pages does, for checking a production
 build locally. It backs both `pnpm serve-website` and the website package's
 own `serve` script, which is what `docusaurus build` tells you to run.

 It replaces `docusaurus serve`, which is not equivalent for this site. The site
 sets `trailingSlash: false`, and `serve` applies that to the static files too:
 it redirects `/plugin-previews/<slug>/` to `/plugin-previews/<slug>`, so the
 framed preview page's relative asset URLs (`./assets/main-*.js`) resolve one
 directory too high and 404 — the page loads but its chart never runs. GitHub
 Pages serves the directory itself, as this does.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(repoRoot, 'website', 'build');
const DEFAULT_PORT = 3010;
/** Matches `baseUrl` in docusaurus.config.js. */
const BASE = '/lightweight-charts';

const CONTENT_TYPES = {
	'.css': 'text/css',
	'.html': 'text/html; charset=utf-8',
	'.ico': 'image/x-icon',
	'.jpg': 'image/jpeg',
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.map': 'application/json',
	'.md': 'text/markdown; charset=utf-8',
	'.mjs': 'text/javascript',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.txt': 'text/plain; charset=utf-8',
	'.woff2': 'font/woff2',
	'.xml': 'application/xml',
};

/**
 * The file a URL resolves to, or null. Tried in the order Pages tries them: the
 * path itself, its `index.html`, and the `.html` beside it (Docusaurus writes
 * `plugins/<slug>.html` for a route without a trailing slash).
 */
function resolveFile(url) {
	const relative = url.startsWith(BASE) ? url.slice(BASE.length) : url;
	// A URL is never allowed to climb out of the build directory.
	const target = path.resolve(buildDir, `.${path.posix.normalize(relative)}`);
	if (target !== buildDir && !target.startsWith(buildDir + path.sep)) {
		return null;
	}
	const candidates = [target, path.join(target, 'index.html'), `${target.replace(/\/$/, '')}.html`];
	return candidates.find(file => fs.existsSync(file) && fs.statSync(file).isFile()) ?? null;
}

function main() {
	const { values } = parseArgs({ options: { port: { type: 'string' }, help: { type: 'boolean', short: 'h' } } });
	if (values.help) {
		console.log(`
Usage: node scripts/serve-website.mjs [--port <port>]

Serves website/build under ${BASE}/ the way GitHub Pages does.
Build the site first with \`pnpm --filter lightweight-charts-website build\`.
`);
		process.exit(0);
	}
	if (!fs.existsSync(buildDir)) {
		console.error(`❌ No build to serve at ${buildDir}. Run \`pnpm --filter lightweight-charts-website build\` first.`);
		process.exit(1);
	}

	const port = Number(values.port ?? DEFAULT_PORT);
	http.createServer((request, response) => {
		const url = decodeURIComponent((request.url ?? '/').split('?')[0]);
		const file = resolveFile(url);
		if (file === null) {
			// Pages answers an unknown route with the site's own 404 page.
			const notFound = path.join(buildDir, '404.html');
			response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
			response.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : `Not found: ${url}`);
			return;
		}
		response.writeHead(200, { 'content-type': CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream' });
		response.end(fs.readFileSync(file));
	}).listen(port, () => {
		console.log(`\n✨ Serving website/build at http://localhost:${port}${BASE}/\n`);
		console.log('Press Ctrl+C to stop.');
	});
}

main();
