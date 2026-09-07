import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import { findWorkspacePlugins, validatePackageMetadata } from './utils.mjs';

export const DEFAULT_REGISTRY = 'https://registry.npmjs.org';

const RETRY_DELAY_MS = 1000;
const NO_README_SENTINEL = /^ERROR: No README data found!/i;

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/** An error the registry client must not retry: the answer was definitive. */
class RegistryRefusal extends Error {}

/**
 * Fetches the full packument of a package from the registry.
 *
 * A 404 means the package has never been published and resolves to null. A
 * network error, a 5xx or a 429 is retried; anything that still fails after
 * that, and any other status, throws: the published state could not be
 * confirmed, and the caller must not guess it.
 *
 * @param {string} packageName
 * @param {{ registry?: string, fetchImpl?: typeof fetch, retries?: number, timeoutMs?: number }} [options]
 * @returns {Promise<object | null>}
 */
export async function fetchPackument(packageName, options = {}) {
	const {
		registry = DEFAULT_REGISTRY,
		fetchImpl = fetch,
		retries = 3,
		timeoutMs = 15000,
	} = options;
	const attempts = Math.max(1, retries);
	const url = `${registry.replace(/\/+$/, '')}/${packageName.replace('/', '%2F')}`;
	let lastError;

	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			const response = await fetchImpl(url, {
				headers: { accept: 'application/json' },
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
			return await response.json();
		} catch (err) {
			lastError = err;
			if (err instanceof RegistryRefusal || attempt === attempts) {
				break;
			}
			await delay(RETRY_DELAY_MS * attempt);
		}
	}

	throw new Error(`Could not fetch ${packageName} from ${registry}: ${lastError.message}`);
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

/**
 * The README of the latest release. The packument's root README belongs to
 * whichever version was published last, which is not always `latest`, so a
 * README carried by the manifest itself wins.
 */
function readmeOf(packument, manifest) {
	const readme = (textOrNull(manifest.readme) ?? textOrNull(packument.readme) ?? '').trim();
	return readme && !NO_README_SENTINEL.test(readme) ? readme : null;
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
		readme: readmeOf(packument, manifest),
	};
}

/**
 * Validates every workspace plugin and throws one error listing all problems,
 * so a broken manifest fails the docs build instead of producing a partial entry.
 */
function validateAll(plugins) {
	const problems = [];
	for (const plugin of plugins) {
		const result = validatePackageMetadata(plugin.dir, { isOfficial: true });
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
function toCatalogueEntry(plugin, release, repoRoot, log) {
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

	let readme = release.readme;
	if (readme === null) {
		log.warn(`${plugin.name}: the registry has no README for ${release.version}, using the workspace one`);
		readme = readWorkspaceReadme(plugin);
	}
	if (release.description === null) {
		log.warn(`${plugin.name}: the published manifest has no description, using the workspace one`);
	}

	return {
		name: plugin.name,
		slug: plugin.name.slice(plugin.name.indexOf('/') + 1).replace(/^lwc-plugin-/, ''),
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
 * @param {{ warn: (message: string) => void }} [options.log] - Sink for warnings.
 */
export async function buildCatalogueData(options) {
	const {
		repoRoot,
		offline = false,
		fetchImpl,
		retries,
		log = console,
	} = options;
	// One spelling whether it came from the default, an env var or pnpm's npm_config_registry.
	const registry = (options.registry ?? DEFAULT_REGISTRY).replace(/\/+$/, '');

	const plugins = findWorkspacePlugins(repoRoot);
	validateAll(plugins);

	if (offline && plugins.length > 0) {
		log.warn('Offline mode: the registry is not consulted and no plugin is treated as published.');
	}

	const releases = await Promise.all(plugins.map(async plugin => ({
		plugin,
		release: offline ? null : publishedRelease(await fetchPackument(plugin.name, { registry, fetchImpl, retries })),
	})));

	const entries = [];
	const unpublished = [];
	for (const { plugin, release } of releases) {
		if (release === null) {
			unpublished.push(plugin.name);
		} else {
			entries.push(toCatalogueEntry(plugin, release, repoRoot, log));
		}
	}

	assertUniqueSlugs(entries);
	entries.sort((a, b) => a.lwcPlugin.title.localeCompare(b.lwcPlugin.title, 'en'));
	unpublished.sort();

	return {
		registry: offline ? null : registry,
		plugins: entries,
		unpublished,
	};
}
