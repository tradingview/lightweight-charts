/* eslint-disable
	@typescript-eslint/no-floating-promises,
	@typescript-eslint/no-unused-expressions,
	@typescript-eslint/tslint/config,
	@typescript-eslint/naming-convention
*/
import { expect } from 'chai';
import { describe, it } from 'node:test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

import { findWorkspacePlugins } from '../../scripts/plugins/utils.mjs';
import {
	buildCatalogueData,
	fetchPackument,
	publishedRelease,
	type Packument,
} from '../../scripts/plugins/catalogue-data.mjs';

const validReadme = [
	'# Sample',
	'',
	'A sample plugin.',
	'',
	'## Installation',
	'',
	'### npm',
	'',
	'```js',
	"import { Sample } from '@tradingview/lwc-plugin-sample';",
	'```',
	'',
	'### CDN',
	'',
	'```html',
	'<script type="importmap">{}</script>',
	'```',
	'',
	'## Usage',
	'',
	'```js',
	'series.attachPrimitive(new Sample());',
	'```',
	'',
].join('\n');

function validManifest(name: string, version: string): Record<string, unknown> {
	const unscoped = name.slice(name.indexOf('/') + 1);
	return {
		name,
		version,
		description: `Workspace description of ${name}`,
		license: 'Apache-2.0',
		keywords: ['lightweight-charts-plugin'],
		repository: { type: 'git', url: 'git+https://github.com/tradingview/lightweight-charts.git', directory: `packages/${unscoped}` },
		publishConfig: { access: 'public' },
		peerDependencies: { 'lightweight-charts': '^5.0.0' },
		lwcPlugin: {
			title: `Title of ${name}`,
			category: 'series-primitive',
			lifecycle: 'current',
			origin: 'official',
			demo: 'src/example/index.html',
			tags: ['sample'],
		},
	};
}

/** Creates a temporary repository root with the given plugin packages under packages/. */
function makeRepo(packages: Record<string, Record<string, unknown> | string>): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-catalogue-'));
	for (const [folder, manifest] of Object.entries(packages)) {
		const dir = path.join(root, 'packages', folder);
		fs.mkdirSync(path.join(dir, 'src', 'example'), { recursive: true });
		fs.writeFileSync(path.join(dir, 'package.json'), typeof manifest === 'string' ? manifest : JSON.stringify(manifest, null, 2));
		fs.writeFileSync(path.join(dir, 'README.md'), validReadme);
		fs.writeFileSync(path.join(dir, 'src', 'example', 'index.html'), '<!doctype html>');
	}
	return root;
}

function packument(latest: string, extra: Partial<Packument> & { manifest?: Record<string, unknown> } = {}): Packument {
	const { manifest = {}, ...rest } = extra;
	return {
		'dist-tags': { latest },
		versions: {
			[latest]: {
				description: `Published description ${latest}`,
				license: 'Apache-2.0',
				keywords: ['lightweight-charts-plugin', 'published'],
				peerDependencies: { 'lightweight-charts': '^5.1.0' },
				...manifest,
			},
		},
		time: { [latest]: '2026-09-01T10:00:00.000Z' },
		readme: `# Published README ${latest}`,
		...rest,
	};
}

function response(status: number, body: unknown): Response {
	return { status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) } as unknown as Response;
}

/** A fetch stand-in answering per package name: a packument, 404 for null, a status number, or a thrown error. */
function fakeFetch(answers: Record<string, Packument | null | number | Error>, calls: string[] = []): typeof fetch {
	return ((input: string | URL | Request) => {
		const url = String(input);
		calls.push(url);
		const name = decodeURIComponent(url.slice(url.lastIndexOf('/') + 1));
		const answer = answers[name];
		if (answer instanceof Error) {
			return Promise.reject(answer);
		}
		if (typeof answer === 'number') {
			return Promise.resolve(response(answer, {}));
		}
		if (answer === null || answer === undefined) {
			return Promise.resolve(response(404, {}));
		}
		return Promise.resolve(response(200, answer));
	}) as typeof fetch;
}

const silent = { warn: () => {} };

async function rejection(promise: Promise<unknown>): Promise<Error> {
	try {
		await promise;
	} catch (e) {
		return e as Error;
	}
	throw new Error('expected a rejection');
}

describe('Plugin catalogue data', () => {
	describe('publishedRelease', () => {
		it('should read the latest version and what the registry knows about it', () => {
			const release = publishedRelease(packument('1.2.0', { manifest: { deprecated: 'use the other one' } }));
			expect(release).to.deep.equal({
				version: '1.2.0',
				publishedAt: '2026-09-01T10:00:00.000Z',
				peerRange: '^5.1.0',
				description: 'Published description 1.2.0',
				license: 'Apache-2.0',
				keywords: ['lightweight-charts-plugin', 'published'],
				deprecated: 'use the other one',
				readme: '# Published README 1.2.0',
			});
		});

		it('should treat missing dist-tags and the no-README sentinel as absent', () => {
			expect(publishedRelease(null)).to.be.null;
			expect(publishedRelease({ time: { unpublished: '2026-01-01T00:00:00.000Z' } })).to.be.null;
			const release = publishedRelease(packument('1.0.0', { readme: 'ERROR: No README data found!', manifest: { peerDependencies: {} } }));
			expect(release?.readme).to.be.null;
			expect(release?.peerRange).to.be.null;
			expect(release?.deprecated).to.be.null;
		});

		it('should refuse a latest tag without a manifest', () => {
			expect(() => publishedRelease({ 'dist-tags': { latest: '2.0.0' }, versions: {} })).to.throw(/tags 2\.0\.0 as latest/);
		});
	});

	describe('fetchPackument', () => {
		it('should return null for 404 and retry transient failures', async () => {
			let attempts = 0;
			const flaky = (() => {
				attempts++;
				return attempts < 3 ? Promise.reject(new Error('ECONNRESET')) : Promise.resolve(response(200, packument('1.0.0')));
			}) as typeof fetch;
			expect((await fetchPackument('x', { fetchImpl: flaky, retries: 3 }))?.['dist-tags']?.latest).to.equal('1.0.0');
			expect(attempts).to.equal(3);

			expect(await fetchPackument('x', { fetchImpl: fakeFetch({}), retries: 1 })).to.be.null;
		});

		it('should retry a 5xx but not another 4xx', async () => {
			const calls: string[] = [];
			const error = await rejection(fetchPackument('x', { fetchImpl: fakeFetch({ x: 503 }, calls), retries: 3 }));
			expect(error.message).to.match(/responded with 503/);
			expect(calls).to.have.lengthOf(3);

			calls.length = 0;
			const refused = await rejection(fetchPackument('x', { fetchImpl: fakeFetch({ x: 403 }, calls), retries: 3 }));
			expect(refused.message).to.match(/responded with 403/);
			expect(calls).to.have.lengthOf(1);
		});

		it('should name the package when the registry keeps failing, and make at least one attempt', async () => {
			const down = (() => Promise.reject(new Error('ENOTFOUND'))) as typeof fetch;
			const error = await rejection(fetchPackument('@tradingview/lwc-plugin-a', { fetchImpl: down, retries: 0 }));
			expect(error.message).to.match(/Could not fetch @tradingview\/lwc-plugin-a from .*ENOTFOUND/);
		});
	});

	describe('buildCatalogueData', () => {
		it('should fail on invalid metadata, listing every problem, before touching the registry', async () => {
			const broken = validManifest('@tradingview/lwc-plugin-broken', '1.0.0');
			delete broken.description;
			(broken.lwcPlugin as Record<string, unknown>).category = 'nonsense';
			const root = makeRepo({ 'lwc-plugin-broken': broken, 'lwc-plugin-fine': validManifest('@tradingview/lwc-plugin-fine', '1.0.0') });
			const calls: string[] = [];
			try {
				const error = await rejection(buildCatalogueData({ repoRoot: root, fetchImpl: fakeFetch({}, calls), log: silent }));
				expect(error.message).to.include('Plugin metadata is invalid');
				expect(error.message).to.include('@tradingview/lwc-plugin-broken');
				expect(error.message).to.include("'description'");
				expect(error.message).to.include('/category should be equal to one of the allowed values');
				expect(error.message).to.not.include('lwc-plugin-fine');
				expect(calls).to.be.empty;
			} finally {
				fs.rmSync(root, { recursive: true, force: true });
			}
		});

		it('should fail on a manifest that is not valid JSON', () => {
			const root = makeRepo({ 'lwc-plugin-corrupt': '{ not json' });
			try {
				expect(() => findWorkspacePlugins(root)).to.throw(/Invalid JSON in .*lwc-plugin-corrupt/);
			} finally {
				fs.rmSync(root, { recursive: true, force: true });
			}
		});

		it('should list unpublished packages by name, sorted, and give them no entry', async () => {
			const root = makeRepo({
				'lwc-plugin-zeta': validManifest('@tradingview/lwc-plugin-zeta', '1.0.0'),
				'lwc-plugin-alpha': validManifest('@tradingview/lwc-plugin-alpha', '1.0.0'),
			});
			try {
				const data = await buildCatalogueData({ repoRoot: root, fetchImpl: fakeFetch({}), log: silent });
				expect(data.plugins).to.be.empty;
				expect(data.unpublished).to.deep.equal(['@tradingview/lwc-plugin-alpha', '@tradingview/lwc-plugin-zeta']);
			} finally {
				fs.rmSync(root, { recursive: true, force: true });
			}
		});

		it('should describe a published package from the registry and curate it from the workspace', async () => {
			const manifest = validManifest('@tradingview/lwc-plugin-line', '1.0.0');
			delete (manifest.lwcPlugin as Record<string, unknown>).tags;
			(manifest.lwcPlugin as Record<string, unknown>).demo = './src/example/index.html';
			const root = makeRepo({ 'lwc-plugin-line': manifest });
			try {
				const data = await buildCatalogueData({
					repoRoot: root,
					fetchImpl: fakeFetch({ '@tradingview/lwc-plugin-line': packument('1.0.0') }),
					registry: 'https://registry.example.test',
					log: silent,
				});
				expect(data.registry).to.equal('https://registry.example.test');
				expect(data.unpublished).to.be.empty;
				expect(data.plugins).to.have.lengthOf(1);
				const [entry] = data.plugins;
				expect(entry.name).to.equal('@tradingview/lwc-plugin-line');
				expect(entry.slug).to.equal('line');
				// from the registry
				expect(entry.version).to.equal('1.0.0');
				expect(entry.publishedAt).to.equal('2026-09-01T10:00:00.000Z');
				expect(entry.peerRange).to.equal('^5.1.0');
				expect(entry.description).to.equal('Published description 1.0.0');
				expect(entry.keywords).to.deep.equal(['lightweight-charts-plugin', 'published']);
				expect(entry.readme).to.equal('# Published README 1.0.0');
				expect(entry.deprecated).to.be.null;
				expect(entry.pendingVersion).to.be.null;
				// from the workspace, normalised
				expect(entry.lwcPlugin.title).to.equal('Title of @tradingview/lwc-plugin-line');
				expect(entry.lwcPlugin.tags).to.deep.equal([]);
				expect(entry.repository.directory).to.equal('packages/lwc-plugin-line');
				expect(entry.demoPath).to.equal('packages/lwc-plugin-line/src/example/index.html');
				expect(entry.npmUrl).to.equal('https://www.npmjs.com/package/@tradingview/lwc-plugin-line');
			} finally {
				fs.rmSync(root, { recursive: true, force: true });
			}
		});

		it('should fall back to workspace fields the registry lacks, with a warning for the README', async () => {
			const root = makeRepo({ 'lwc-plugin-line': validManifest('@tradingview/lwc-plugin-line', '1.0.0') });
			const warnings: string[] = [];
			try {
				const bare = packument('1.0.0', { readme: '', manifest: { description: undefined, keywords: [], peerDependencies: {} } });
				const data = await buildCatalogueData({
					repoRoot: root,
					fetchImpl: fakeFetch({ '@tradingview/lwc-plugin-line': bare }),
					log: { warn: message => warnings.push(message) },
				});
				const [entry] = data.plugins;
				expect(entry.readme).to.equal(validReadme);
				expect(entry.description).to.equal('Workspace description of @tradingview/lwc-plugin-line');
				expect(entry.keywords).to.deep.equal(['lightweight-charts-plugin']);
				expect(entry.peerRange).to.be.null;
				expect(warnings.join('\n')).to.include('no README');
				expect(warnings.join('\n')).to.include('no lightweight-charts peer range');
			} finally {
				fs.rmSync(root, { recursive: true, force: true });
			}
		});

		it('should keep a published plugin live while a newer workspace version awaits publishing, and warn when behind', async () => {
			const root = makeRepo({
				'lwc-plugin-ahead': validManifest('@tradingview/lwc-plugin-ahead', '1.1.0'),
				'lwc-plugin-behind': validManifest('@tradingview/lwc-plugin-behind', '1.0.0'),
			});
			const warnings: string[] = [];
			try {
				const data = await buildCatalogueData({
					repoRoot: root,
					fetchImpl: fakeFetch({
						'@tradingview/lwc-plugin-ahead': packument('1.0.0'),
						'@tradingview/lwc-plugin-behind': packument('1.0.5'),
					}),
					log: { warn: message => warnings.push(message) },
				});
				const byName = Object.fromEntries(data.plugins.map(entry => [entry.slug, entry]));
				expect(byName.ahead.version).to.equal('1.0.0');
				expect(byName.ahead.pendingVersion).to.equal('1.1.0');
				expect(byName.behind.version).to.equal('1.0.5');
				expect(byName.behind.pendingVersion).to.be.null;
				expect(warnings.join('\n')).to.match(/lwc-plugin-behind: .*1\.0\.0 is behind the published 1\.0\.5/);
			} finally {
				fs.rmSync(root, { recursive: true, force: true });
			}
		});

		it('should sort entries by title and expose a deprecation notice', async () => {
			const root = makeRepo({
				'lwc-plugin-b': { ...validManifest('@tradingview/lwc-plugin-b', '1.0.0'), lwcPlugin: { ...(validManifest('@tradingview/lwc-plugin-b', '1.0.0').lwcPlugin as object), title: 'Alpha' } },
				'lwc-plugin-a': { ...validManifest('@tradingview/lwc-plugin-a', '1.0.0'), lwcPlugin: { ...(validManifest('@tradingview/lwc-plugin-a', '1.0.0').lwcPlugin as object), title: 'Zulu' } },
			});
			try {
				const data = await buildCatalogueData({
					repoRoot: root,
					fetchImpl: fakeFetch({
						'@tradingview/lwc-plugin-a': packument('1.0.0', { manifest: { deprecated: 'superseded' } }),
						'@tradingview/lwc-plugin-b': packument('1.0.0'),
					}),
					log: silent,
				});
				expect(data.plugins.map(entry => entry.lwcPlugin.title)).to.deep.equal(['Alpha', 'Zulu']);
				expect(data.plugins[1].deprecated).to.equal('superseded');
			} finally {
				fs.rmSync(root, { recursive: true, force: true });
			}
		});

		it('should fail the build when the registry is unreachable', async () => {
			const root = makeRepo({ 'lwc-plugin-line': validManifest('@tradingview/lwc-plugin-line', '1.0.0') });
			try {
				const error = await rejection(buildCatalogueData({
					repoRoot: root,
					fetchImpl: fakeFetch({ '@tradingview/lwc-plugin-line': new Error('ECONNREFUSED') }),
					retries: 1,
					log: silent,
				}));
				expect(error.message).to.match(/Could not fetch @tradingview\/lwc-plugin-line/);
			} finally {
				fs.rmSync(root, { recursive: true, force: true });
			}
		});

		it('should treat every package as unpublished in offline mode without calling the registry', async () => {
			const root = makeRepo({ 'lwc-plugin-line': validManifest('@tradingview/lwc-plugin-line', '1.0.0') });
			const calls: string[] = [];
			const warnings: string[] = [];
			try {
				const data = await buildCatalogueData({
					repoRoot: root,
					offline: true,
					fetchImpl: fakeFetch({}, calls),
					log: { warn: message => warnings.push(message) },
				});
				expect(calls).to.be.empty;
				expect(data.registry).to.be.null;
				expect(data.plugins).to.be.empty;
				expect(data.unpublished).to.deep.equal(['@tradingview/lwc-plugin-line']);
				expect(warnings.join('\n')).to.include('Offline mode');
			} finally {
				fs.rmSync(root, { recursive: true, force: true });
			}
		});
	});
});
