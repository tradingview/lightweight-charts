/** Catalogue metadata block of a plugin package, validated against lwc-plugin-metadata.schema.json. */
export interface LwcPluginMetadata {
	title: string;
	category: 'custom-series' | 'series-primitive' | 'pane-primitive';
	lifecycle: 'current' | 'legacy' | 'deprecated' | 'experimental';
	origin: 'official' | 'community';
	author?: string;
	/** Path of the demo page, relative to the package directory. */
	demo: string;
	/**
	 * Path of the catalogue preview page, relative to the package directory.
	 * Optional: community packages and packages predating the field have none.
	 */
	preview?: string;
	/** Height in CSS pixels for the preview frame. Only valid with `preview`. */
	previewHeight?: number;
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
	/** Repo-relative POSIX path of the preview page source, or null when the package declares none. */
	previewPath: string | null;
	/**
	 * Site-root-relative URL of the built demo page, `/plugin-demos/<slug>/`.
	 * Produced by `pnpm plugins:build-demos`; pass it through `useBaseUrl`.
	 */
	demoUrl: string;
	/** The same for the preview page, `/plugin-previews/<slug>/`, or null when the package declares none. */
	previewUrl: string | null;
	/** Height in CSS pixels for the preview frame; {@link DEFAULT_PREVIEW_HEIGHT} when the package declares none. */
	previewHeight: number;
	/** README taken from the published version's tarball, Markdown; the workspace README if that tarball has none. */
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
	/** `dist.tarball` of the release, where its README is read from. */
	tarball: string | null;
	/** Subresource Integrity of that tarball (`dist.integrity`, or the legacy shasum as SRI). */
	integrity: string | null;
}

export interface Packument {
	'dist-tags'?: Record<string, string>;
	versions?: Record<string, {
		description?: string;
		license?: string;
		keywords?: string[];
		deprecated?: string;
		peerDependencies?: Record<string, string>;
		dist?: { tarball?: string; integrity?: string; shasum?: string };
	}>;
	time?: Record<string, string>;
	readme?: string;
}

export const DEFAULT_REGISTRY: string;

/** Frame height used when a package declares no `previewHeight`. */
export const DEFAULT_PREVIEW_HEIGHT: number;

export function fetchPackument(
	packageName: string,
	options?: { registry?: string; fetchImpl?: typeof fetch; retries?: number; timeoutMs?: number; retryDelayMs?: number }
): Promise<Packument | null>;

export function verifyIntegrity(buffer: Buffer, integrity: string): void;

export function publishedRelease(packument: Packument | null | undefined): PublishedRelease | null;

export function fetchTarballReadme(
	tarballUrl: string,
	options?: { integrity?: string | null; fetchImpl?: typeof fetch; retries?: number; timeoutMs?: number; retryDelayMs?: number }
): Promise<string | null>;

export function buildCatalogueData(options: {
	repoRoot: string;
	registry?: string;
	offline?: boolean;
	fetchImpl?: typeof fetch;
	retries?: number;
	retryDelayMs?: number;
	log?: { warn: (message: string) => void };
}): Promise<CatalogueData>;
