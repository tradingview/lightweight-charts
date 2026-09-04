/** Catalogue metadata block of a plugin package, validated against lwc-plugin-metadata.schema.json. */
export interface LwcPluginMetadata {
	title: string;
	category: 'custom-series' | 'series-primitive' | 'pane-primitive';
	lifecycle: 'current' | 'legacy' | 'deprecated' | 'experimental';
	origin: 'official' | 'community';
	author?: string;
	/** Path of the demo page, relative to the package directory. */
	demo: string;
	/** Always an array; an absent `tags` in the manifest becomes `[]`. */
	tags: string[];
}

/**
 * One published plugin. Fields that describe the published artefact come from
 * the registry, so the page matches what `npm install` delivers; fields that
 * curate the entry come from the workspace.
 */
export interface CatalogueEntry {
	/** npm package name, e.g. `@tradingview/lwc-plugin-vertical-line`. */
	name: string;
	/** Unscoped name without the `lwc-plugin-` prefix, e.g. `vertical-line`; unique, the URL segment. */
	slug: string;
	/** `description` of the published manifest. */
	description: string;
	/** Latest version published on npm. */
	version: string;
	/**
	 * Workspace version when it is newer than the published one, else null. Set
	 * between a merged version bump and its publish; pages should mark the
	 * entry as having a release pending rather than hide it.
	 */
	pendingVersion: string | null;
	/** ISO timestamp of the published version, from the registry. */
	publishedAt: string | null;
	/** `peerDependencies["lightweight-charts"]` of the published version; null if it declares none. */
	peerRange: string | null;
	/** The `npm deprecate` message of the published version, or null. */
	deprecated: string | null;
	/** `license` of the published manifest. */
	license: string;
	/** `keywords` of the published manifest. */
	keywords: string[];
	repository: {
		/** `repository.url` of the workspace manifest. */
		url: string | null;
		/** Repo-relative package directory, e.g. `packages/lwc-plugin-vertical-line`. */
		directory: string;
	};
	npmUrl: string;
	/** `lwcPlugin` block of the workspace manifest. */
	lwcPlugin: LwcPluginMetadata;
	/** Repo-relative POSIX path of the demo page source, e.g. `packages/lwc-plugin-x/src/example/index.html`. */
	demoPath: string;
	/** README of the published version as the registry holds it, Markdown; the workspace README if the registry has none. */
	readme: string;
}

/** Everything but the README, which is per page and kept out of the site-wide global data. */
export type CatalogueEntrySummary = Omit<CatalogueEntry, 'readme'>;

/** Output of `pnpm plugins:catalogue`. */
export interface CatalogueData {
	/** Registry the published state was confirmed against; null in offline mode. */
	registry: string | null;
	/** Published plugins, sorted by title. The only entries the pages render. */
	plugins: CatalogueEntry[];
	/** Valid workspace packages that are not published yet, by name, sorted. */
	unpublished: string[];
}

/** What `usePluginCatalogue()` returns on the site. */
export interface CatalogueGlobalData {
	registry: string | null;
	plugins: CatalogueEntrySummary[];
	unpublished: string[];
}

export interface PublishedRelease {
	version: string;
	publishedAt: string | null;
	peerRange: string | null;
	description: string | null;
	license: string | null;
	keywords: string[];
	deprecated: string | null;
	readme: string | null;
}

export interface Packument {
	'dist-tags'?: Record<string, string>;
	versions?: Record<string, {
		description?: string;
		license?: string;
		keywords?: string[];
		deprecated?: string;
		peerDependencies?: Record<string, string>;
	}>;
	time?: Record<string, string>;
	readme?: string;
}

export const DEFAULT_REGISTRY: string;

export function fetchPackument(
	packageName: string,
	options?: { registry?: string; fetchImpl?: typeof fetch; retries?: number; timeoutMs?: number }
): Promise<Packument | null>;

export function publishedRelease(packument: Packument | null | undefined): PublishedRelease | null;

export function buildCatalogueData(options: {
	repoRoot: string;
	registry?: string;
	offline?: boolean;
	fetchImpl?: typeof fetch;
	retries?: number;
	log?: { warn: (message: string) => void };
}): Promise<CatalogueData>;
