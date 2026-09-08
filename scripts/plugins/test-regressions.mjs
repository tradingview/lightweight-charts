/* global window */
// Run with node --import tsx. Uses the same case discovery, HTML and native
// mouse actions as the comparative graphics suite, with assertions and an
// unconditional screenshot instead of requiring a golden plugin build.
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer';

import { generatePluginPageContent } from '../../tests/e2e/graphics/generate-plugin-test-cases.ts';
import { getPluginTestCases, findPluginStandalone, packagesDir } from '../../tests/e2e/graphics/helpers/get-plugin-test-cases.ts';
import { runInteractionsOnPage } from '../../tests/e2e/helpers/perform-interactions.ts';

async function preloadBundles(root, mode, groups) {
	const files = new Map([['/library.mjs', await readFile(resolve(root, `dist/lightweight-charts.standalone.${mode}.mjs`))]]);
	for (const group of groups) {
		const bundle = findPluginStandalone(packagesDir, group);
		if (!bundle) {
			throw new Error(`Build ${group.packageName} before running regressions`);
		}
		files.set(`/${group.folder}.js`, await readFile(bundle));
	}
	return files;
}

async function main() {
	const root = resolve(import.meta.dirname, '../..');
	const outDir = resolve(process.env.CMP_OUT_DIR || resolve(root, 'tests/e2e/graphics/.gendata/plugin-regressions'));
	const mode = process.env.PRODUCTION_BUILD === 'true' ? 'production' : 'development';
	const dpr = Number(process.env.DEVICE_PIXEL_RATIO || 1);
	const groups = getPluginTestCases().map(group => ({ ...group, testCases: group.testCases.filter(test => test.name.startsWith('regression-')) })).filter(group => group.testCases.length);
	if (!groups.length) {
		throw new Error('No plugin regression cases matched GREP');
	}
	await mkdir(outDir, { recursive: true });
	// Only explicit, preloaded bundles are served, and only on loopback. Reading
	// buffers also works when the checkout lives inside a hidden directory.
	const files = await preloadBundles(root, mode, groups);
	const server = createServer((request, response) => {
		const file = files.get(request.url);
		response.writeHead(file ? 200 : 404, { 'Content-Type': 'text/javascript', 'Access-Control-Allow-Origin': '*' });
		response.end(file);
	});
	await new Promise(resolveReady => server.listen(0, '127.0.0.1', resolveReady));
	const prefix = `http://127.0.0.1:${server.address().port}`;
	let browser;
	const results = [];
	try {
		browser = await puppeteer.launch({ headless: true, args: process.env.NO_SANDBOX ? ['--no-sandbox'] : [], defaultViewport: { width: 600, height: 600, deviceScaleFactor: dpr } });
		for (const group of groups) {
			for (const test of group.testCases) {
				const name = `${group.folder}/${test.name}`;
				const dir = resolve(outDir, name);
				await mkdir(dir, { recursive: true });
				const page = await browser.newPage();
				const errors = [];
				page.on('pageerror', error => errors.push(error.message));
				page.on('console', message => { if (message.type() === 'error') { errors.push(message.text()); } });
				page.on('response', response => { if (!response.ok()) { errors.push(`HTTP ${response.status()}: ${response.url()}`); } });
				let checks = [];
				try {
					const html = generatePluginPageContent(`${prefix}/library.mjs`, group.packageName, `${prefix}/${group.folder}.js`, test.caseContent, mode);
					await writeFile(resolve(dir, 'case.html'), html);
					await page.setContent(html);
					await page.waitForFunction(() => Object.prototype.hasOwnProperty.call(window, 'testCaseReady'), { timeout: 5000 });
					await page.evaluate(() => window.testCaseReady);
					await runInteractionsOnPage(page);
				} catch (error) {
					errors.push(error.message);
				} finally {
					checks = await page.evaluate(() => window.PluginTest?.checks ?? []);
					if (!checks.length) { errors.push('The case did not execute any assertions'); }
					// In particular, preserve the broken render when a page error or
					// assertion fails. Assertions never bless the current broken state.
					await page.screenshot({ path: resolve(dir, 'actual.png') });
					await page.close();
				}
				const passed = errors.length === 0 && checks.every(check => check.passed);
				const result = { name, passed, checks, errors };
				results.push(result);
				await writeFile(resolve(dir, 'result.json'), JSON.stringify(result, null, 2));
				console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
			}
		}
	} finally {
		await browser?.close();
		await new Promise(resolveClosed => server.close(resolveClosed));
	}
	const escape = text => String(text).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
	await writeFile(resolve(outDir, 'results.json'), JSON.stringify(results, null, 2));
	await writeFile(resolve(outDir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Plugin regression results</title><style>body{font:16px system-ui;margin:32px;background:#f4f5f7}article{display:inline-block;vertical-align:top;background:white;padding:16px;margin:8px;max-width:600px}img{width:100%}pre{white-space:pre-wrap}h2{font-size:16px}</style><h1>Plugin regressions — ${escape(mode)}, DPR ${escape(dpr)}</h1>${results.map(result => `<article><h2>${result.passed ? 'PASS' : 'FAIL'} ${escape(result.name)}</h2><a href="${result.name}/actual.png"><img src="${result.name}/actual.png"></a><pre>${escape(JSON.stringify({ checks: result.checks, errors: result.errors }, null, 2))}</pre></article>`).join('')}`);
	console.log(`${results.filter(result => result.passed).length}/${results.length} passed; screenshots: ${outDir}/index.html`);
	process.exitCode = results.every(result => result.passed) ? 0 : 1;
}

main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
