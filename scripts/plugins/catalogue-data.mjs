import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import semver from 'semver';
import { findWorkspacePlugins, validatePackageMetadata } from './utils.mjs';

export const DEFAULT_REGISTRY = 'https://registry.npmjs.org';

const RETRY_DELAY_MS = 1000;
const REGISTRY_CONCURRENCY = 4;

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/** An error the registry client must not retry: the answer was definitive. */
class RegistryRefusal extends Error {}

/**
 * GETs a registry URL. Resolves to null on 404, to the response otherwise. A
 * network error, a 5xx or a 429 is retried; anything that still fails after
 * that, and any other status, throws the last error.
 */
async function fetchWithRetry(url, { fetchImpl = fetch, retries = 3, timeoutMs = 15000, retryDelayMs = RETRY_DELAY_MS, accept }) {
	const attempts = Math.max(1, retries);
	let lastError;
	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			const response = await fetchImpl(url, {
				headers: { accept },
				signal: AbortSignal.timeout(timeoutMs),
			});
			if (response.status === 404) {
				return null;
			}
			if (response.status >= 500 || response.status === 429) {
				throw new Error(`registry responded with ${response.status}`);
			}
			if (!response.ok) {
				throw new RegistryRefusal(`registry responded with ${response.status}`);
			}
			return response;
		} catch (err) {
			lastError = err;
			if (err instanceof RegistryRefusal || attempt === attempts) {
				break;
			}
			await delay(retryDelayMs * attempt);
		}
	}
	throw lastError;
}

/**
 * Fetches the full packument of a package from the registry.
 *
 * A 404 means the package has never been published and resolves to null. Any
 * other failure throws: the published state could not be confirmed, and the
 * caller must not guess it.
 *
 * @param {string} packageName
 * @param {{ registry?: string, fetchImpl?: typeof fetch, retries?: number, timeoutMs?: number, retryDelayMs?: number }} [options]
 * @returns {Promise<object | null>}
 */
export async function fetchPackument(packageName, options = {}) {
	const { registry = DEFAULT_REGISTRY, ...fetchOptions } = options;
	const url = `${registry.replace(/\/+$/, '')}/${packageName.replace('/', '%2F')}`;
	try {
		const response = await fetchWithRetry(url, { ...fetchOptions, accept: 'application/json' });
		return response === null ? null : await response.json();
	} catch (err) {
		throw new Error(`Could not fetch ${packageName} from ${registry}: ${err.message}`);
	}
}

/**
 * Checks a downloaded tarball against the Subresource Integrity string the
 * registry published for it (`sha512-<base64>`, possibly several, space separated).
 */
export function verifyIntegrity(buffer, integrity) {
	const matches = integrity.trim().split(/\s+/).some(token => {
		const dash = token.indexOf('-');
		if (dash === -1) {
			return false;
		}
		const algorithm = token.slice(0, dash);
		if (!/^sha(1|256|384|512)$/.test(algorithm)) {
			return false;
		}
		return createHash(algorithm).update(buffer).digest('base64') === token.slice(dash + 1);
	});
	if (!matches) {
		throw new Error(`the downloaded tarball does not match its published integrity ${integrity}`);
	}
}

/**
 * Reads the README out of a published tarball. The packument's root `readme`
 * belongs to whichever version was published last, not necessarily `latest`,
 * so the file is taken from the release itself. Null when the tarball has none.
 * Its content ends up on the public site, so the download is checked against
 * the integrity the registry published for it when one is given.
 *
 * @param {string} tarballUrl - `dist.tarball` of the release manifest.
 * @param {{ integrity?: string | null, fetchImpl?: typeof fetch, retries?: number, timeoutMs?: number, retryDelayMs?: number }} [options]
 * @returns {Promise<string | null>}
 */
export async function fetchTarballReadme(tarballUrl, options = {}) {
	const { integrity = null, ...fetchOptions } = options;
	let response;
	try {
		response = await fetchWithRetry(tarballUrl, { timeoutMs: 60000, ...fetchOptions, accept: 'application/octet-stream' });
	} catch (err) {
		throw new Error(`Could not fetch ${tarballUrl}: ${err.message}`);
	}
	if (response === null) {
		throw new Error(`The registry lists ${tarballUrl} but does not serve it`);
	}

	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-catalogue-'));
	try {
		const buffer = Buffer.from(await response.arrayBuffer());
		if (integrity !== null) {
			try {
				verifyIntegrity(buffer, integrity);
			} catch (err) {
				throw new Error(`${tarballUrl}: ${err.message}`);
			}
		}
		const file = path.join(tempDir, 'package.tgz');
		fs.writeFileSync(file, buffer);
		const entry = execFileSync('tar', ['-tzf', file], { encoding: 'utf-8' })
			.split(/\r?\n/)
			.map(line => line.trim())
			.find(line => /^package\/readme(\.[^/]+)?$/i.test(line));
		if (!entry) {
			return null;
		}
		const readme = execFileSync('tar', ['-xzOf', file, entry], { encoding: 'utf-8' }).trim();
		return readme || null;
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

/**
 * Reads the published release out of a packument: the version tagged latest and
 * what the registry knows about it. Null when nothing is published, which is
 * also what a fully unpublished package leaves behind.
 *
 * @param {object | null | undefined} packument
 */
/** The value if it is a non-blank string, else null. */
function textOrNull(value) {
	return typeof value === 'string' && value.trim() ? value : null;
}

export function publishedRelease(packument) {
	const latest = packument?.['dist-tags']?.latest;
	if (!latest) {
		return null;
	}
	const manifest = packument.versions?.[latest];
	if (!manifest) {
		throw new Error(`packument tags ${latest} as latest but carries no manifest for it`);
	}
	return {
		version: latest,
		publishedAt: packument.time?.[latest] ?? null,
		peerRange: manifest.peerDependencies?.['lightweight-charts'] ?? null,
		description: textOrNull(manifest.description),
		license: textOrNull(manifest.license),
		keywords: Array.isArray(manifest.keywords) ? manifest.keywords : [],
		deprecated: textOrNull(manifest.deprecated),
		tarball: textOrNull(manifest.dist?.tarball),
		integrity: integrityOf(manifest.dist),
	};
}

/** The SRI string for a release: `dist.integrity`, or the legacy sha1 `shasum` expressed as SRI. */
function integrityOf(dist) {
	const integrity = textOrNull(dist?.integrity);
	if (integrity !== null) {
		return integrity;
	}
	const shasum = textOrNull(dist?.shasum);
	return shasum !== null && /^[0-9a-f]{40}$/i.test(shasum) ? `sha1-${Buffer.from(shasum, 'hex').toString('base64')}` : null;
}

/** Unscoped name without the `lwc-plugin-` prefix: the catalogue's URL segment. */
function slugOf(packageName) {
	return packageName.slice(packageName.indexOf('/') + 1).replace(/^lwc-plugin-/, '');
}

/** Runs `fn` over `items` with at most `limit` in flight, preserving order. */
async function mapWithConcurrency(items, limit, fn) {
	const results = new Array(items.length);
	let next = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (next < items.length) {
			const index = next++;
			results[index] = await fn(items[index]);
		}
	});
	await Promise.all(workers);
	return results;
}

/**
 * Validates every workspace plugin and throws one error listing all problems,
 * so a broken manifest fails the docs build instead of producing a partial entry.
 */
function validateAll(plugins, repoRoot) {
	const problems = [];
	for (const plugin of plugins) {
		const result = validatePackageMetadata(plugin.dir, { isOfficial: true, repoRoot });
		if (!result.valid) {
			problems.push(`${plugin.name}\n  - ${result.errors.join('\n  - ')}`);
		}
	}
	if (problems.length > 0) {
		throw new Error(`Plugin metadata is invalid, the catalogue cannot be built:\n${problems.join('\n')}`);
	}
}

/** A repo-relative POSIX path, whatever separators and `./` segments the input had. */
function toRepoPath(...segments) {
	return path.posix.normalize(segments.join('/').split(/[\\/]+/).join('/'));
}

function readWorkspaceReadme(plugin) {
	const readmePath = ['README.md', 'readme.md']
		.map(file => path.join(plugin.dir, file))
		.find(file => fs.existsSync(file));
	return fs.readFileSync(readmePath, 'utf-8');
}

/**
 * Builds one catalogue entry. What describes the published artefact (version,
 * peer range, description, README, licence, keywords, deprecation) comes from the
 * registry, so the page matches what `npm install` delivers; what curates the
 * entry (the lwcPlugin block, the demo) comes from the workspace.
 */
function toCatalogueEntry(plugin, release, publishedReadme, repoRoot, log) {
	const pkg = plugin.packageJson;
	const packageDir = toRepoPath(path.relative(repoRoot, plugin.dir));

	let pendingVersion = null;
	if (semver.gt(plugin.version, release.version)) {
		pendingVersion = plugin.version;
	} else if (semver.lt(plugin.version, release.version)) {
		log.warn(`${plugin.name}: the workspace version ${plugin.version} is behind the published ${release.version}`);
	}

	if (release.peerRange === null) {
		log.warn(`${plugin.name}: the published manifest declares no lightweight-charts peer range`);
	}

	let readme = publishedReadme;
	if (readme === null) {
		log.warn(`${plugin.name}: the published ${release.version} has no README, using the workspace one`);
		readme = readWorkspaceReadme(plugin);
	}
	for (const [field, missing] of [['description', release.description === null], ['license', release.license === null], ['keywords', release.keywords.length === 0]]) {
		if (missing) {
			log.warn(`${plugin.name}: the published manifest has no ${field}, using the workspace one`);
		}
	}

	return {
		name: plugin.name,
		slug: slugOf(plugin.name),
		description: release.description ?? pkg.description,
		version: release.version,
		pendingVersion,
		publishedAt: release.publishedAt,
		peerRange: release.peerRange,
		deprecated: release.deprecated,
		license: release.license ?? pkg.license,
		keywords: release.keywords.length > 0 ? release.keywords : pkg.keywords ?? [],
		repository: {
			url: pkg.repository?.url ?? null,
			directory: packageDir,
		},
		npmUrl: `https://www.npmjs.com/package/${plugin.name}`,
		lwcPlugin: { ...pkg.lwcPlugin, tags: pkg.lwcPlugin.tags ?? [] },
		demoPath: toRepoPath(packageDir, pkg.lwcPlugin.demo),
		readme,
	};
}

function assertUniqueSlugs(entries) {
	const seen = new Map();
	for (const entry of entries) {
		if (seen.has(entry.slug)) {
			throw new Error(`Plugins ${seen.get(entry.slug)} and ${entry.name} would share the catalogue URL segment '${entry.slug}'`);
		}
		seen.set(entry.slug, entry.name);
	}
}

/**
 * Turns the workspace plugin packages into catalogue data.
 *
 * Every non-private `packages/lwc-plugin-*` package is validated against the
 * package contract first; any problem throws. Then the registry is asked for
 * each package: one that was never published is listed by name only, a
 * published one becomes an entry. In offline mode nothing is asked and nothing
 * is published.
 *
 * @param {object} options
 * @param {string} options.repoRoot - Absolute path to repository root.
 * @param {string} [options.registry] - Registry URL, defaults to npmjs.org.
 * @param {boolean} [options.offline] - Skip the registry; every package counts as unpublished.
 * @param {typeof fetch} [options.fetchImpl] - Fetch implementation, for tests.
 * @param {number} [options.retries] - Registry attempts per package.
 * @param {number} [options.retryDelayMs] - Base delay between attempts.
 * @param {{ warn: (message: string) => void }} [options.log] - Sink for warnings.
 */
export async function buildCatalogueData(options) {
	const {
		repoRoot,
		offline = false,
		fetchImpl,
		retries,
		retryDelayMs,
		log = console,
	} = options;
	const fetchOptions = { fetchImpl, retries, retryDelayMs };
	// One spelling whether it came from the default, an env var or pnpm's npm_config_registry.
	const registry = (options.registry ?? DEFAULT_REGISTRY).replace(/\/+$/, '');

	const plugins = findWorkspacePlugins(repoRoot);
	validateAll(plugins, repoRoot);
	assertUniqueSlugs(plugins.map(plugin => ({ name: plugin.name, slug: slugOf(plugin.name) })));

	if (offline && plugins.length > 0) {
		log.warn('Offline mode: the registry is not consulted and no plugin is treated as published.');
	}

	const releases = await mapWithConcurrency(plugins, REGISTRY_CONCURRENCY, async plugin => {
		if (offline) {
			return { plugin, release: null, readme: null };
		}
		const release = publishedRelease(await fetchPackument(plugin.name, { registry, ...fetchOptions }));
		let readme = null;
		if (release !== null && release.tarball !== null) {
			if (release.integrity === null) {
				log.warn(`${plugin.name}: the registry published no integrity for ${release.version}, the tarball is not verified`);
			}
			readme = await fetchTarballReadme(release.tarball, { integrity: release.integrity, ...fetchOptions });
		} else if (release !== null) {
			log.warn(`${plugin.name}: the published manifest lists no tarball, so its README cannot be read`);
		}
		return { plugin, release, readme };
	});

	const entries = [];
	const unpublished = [];
	for (const { plugin, release, readme } of releases) {
		if (release === null) {
			unpublished.push(plugin.name);
		} else {
			entries.push(toCatalogueEntry(plugin, release, readme, repoRoot, log));
		}
	}

	entries.sort((a, b) => a.lwcPlugin.title.localeCompare(b.lwcPlugin.title, 'en'));
	unpublished.sort();

	return {
		registry: offline ? null : registry,
		plugins: entries,
		unpublished,
	};
}
