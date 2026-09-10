// Shared helpers for the plugin catalogue pages. The data comes
// from the `lwc-plugin-catalogue` Docusaurus plugin (contract in
// scripts/plugins/catalogue-data.d.mts); this module normalizes a contract
// entry into the flat view model the UI renders.
import type {
	CatalogueEntry,
	CatalogueEntrySummary,
} from '../../../plugins/plugin-catalogue/types';

export type PluginStatus =
	'deprecated' | 'pending' | 'experimental' | 'legacy' | 'new' | 'stable';

// Flat view model consumed by the pages.
export interface Plugin {
	slug: string;
	name: string; // lwcPlugin.title
	description: string;
	category: string; // catalogue browse taxonomy — assigned on the docs side
	techCategory: string; // lwcPlugin.category — the schema enum
	searchTerms: string[]; // lwcPlugin.tags + npm keywords
	version: string;
	pendingVersion: string | null;
	peerRange: string | null;
	npmPackage: string; // name
	npmUrl: string;
	repository: string | null; // browsable https URL from repository.url (+ directory)
	// lwcPlugin.origin/author; a community plugin without an author has no name.
	publisher: { type: string; name: string | null };
	license: string;
	publishedAt: string | null; // ISO timestamp from the registry
	deprecatedMessage: string | null; // the npm deprecate message
	status: PluginStatus;
	previewImage: string; // docs-side curated SVG, by slug convention
	/**
	 * Site-root-relative URL of the package's catalogue preview page, or null
	 * when it declares none. Built by `pnpm plugins:build-demos`; run it through
	 * `useBaseUrl` before using it.
	 */
	previewUrl: string | null;
	/**
	 * The same for the package's full demo page. Null only for an entry with no
	 * workspace package behind it, which the catalogue does not produce today
	 * but the detail page still has to render.
	 */
	demoUrl: string | null;
	/** Height in CSS pixels the preview frame is given. */
	previewHeight: number;
}

// The user-facing browse taxonomy deliberately lives here, not in the
// packages: it is curated by the docs side and can evolve without
// republishing anything. A plugin missing from this map falls back to a
// bucket derived from its technical category.
export const CATALOGUE_CATEGORIES: ReadonlyMap<string, string> = new Map([
	['accessibility', 'UX & accessibility'],
	['brushable-area-series', 'Series types'],
	['dual-range-histogram-series', 'Series types'],
	['hlc-area-series', 'Series types'],
	['image-watermark', 'Overlays'],
	['pretty-histogram-series', 'Series types'],
	['rounded-candles-series', 'Series types'],
	['stacked-area-series', 'Series types'],
	['stacked-bars-series', 'Series types'],
	['vertical-line', 'Drawing tools'],
]);

// Sidebar order: the biggest bucket first, small ones after.
export const CATEGORY_ORDER = ['Series types', 'Drawing tools', 'Overlays', 'UX & accessibility'];

function fallbackCategory(techCategory: string): string {
	return techCategory === 'custom-series' ? 'Series types' : 'Overlays';
}

function browsableRepoUrl(repository: CatalogueEntrySummary['repository']): string | null {
	if (!repository.url) {
		return null;
	}
	let base = repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
	// scp-style remote (git@host:org/repo) -> https
	const scp = base.match(/^git@([^:]+):(.+)$/);
	if (scp) {
		base = `https://${scp[1]}/${scp[2]}`;
	}
	if (!/^https?:\/\//.test(base)) {
		return null;
	}
	// The repo's default branch; entries always come from this repository.
	return repository.directory ? `${base}/tree/master/${repository.directory}` : base;
}

const NEW_BADGE_DAYS = 30;

// `now` is the build-time stamp from siteConfig.customFields.catalogueBuildTime,
// not Date.now(): the server render and the hydrated client must agree.
function deriveStatus(entry: CatalogueEntrySummary, now: number): PluginStatus {
	if (entry.deprecated !== null || entry.lwcPlugin.lifecycle === 'deprecated') {
		return 'deprecated';
	}
	if (entry.pendingVersion !== null) {
		return 'pending';
	}
	if (entry.lwcPlugin.lifecycle === 'experimental') {
		return 'experimental';
	}
	if (entry.lwcPlugin.lifecycle === 'legacy') {
		return 'legacy';
	}
	if (entry.publishedAt !== null) {
		const ageMs = now - Date.parse(entry.publishedAt);
		if (ageMs < NEW_BADGE_DAYS * 24 * 60 * 60 * 1000) {
			return 'new';
		}
	}
	return 'stable';
}

export function normalise(entry: CatalogueEntrySummary, now: number): Plugin {
	const meta = entry.lwcPlugin;
	return {
		slug: entry.slug,
		name: meta.title,
		description: entry.description,
		category: CATALOGUE_CATEGORIES.get(entry.slug) ?? fallbackCategory(meta.category),
		techCategory: meta.category,
		searchTerms: [...meta.tags, ...entry.keywords],
		version: entry.version,
		pendingVersion: entry.pendingVersion,
		peerRange: entry.peerRange,
		npmPackage: entry.name,
		npmUrl: entry.npmUrl,
		repository: browsableRepoUrl(entry.repository),
		publisher: {
			type: meta.origin,
			name: meta.author ?? (meta.origin === 'official' ? 'TradingView' : null),
		},
		license: entry.license,
		publishedAt: entry.publishedAt,
		deprecatedMessage: entry.deprecated,
		status: deriveStatus(entry, now),
		previewImage: `assets/previews/${entry.slug}.svg`,
		previewUrl: entry.previewUrl,
		demoUrl: entry.demoUrl,
		previewHeight: entry.previewHeight,
	};
}

// ISO timestamp -> "Sep 8, 2026", or null when the registry gave no date.
export function formatPublishedAt(publishedAt: string | null): string | null {
	if (!publishedAt) {
		return null;
	}
	const date = new Date(publishedAt);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	// Fixed timeZone: the server-rendered day and the viewer's must agree.
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	});
}

export type { CatalogueEntry, CatalogueEntrySummary };
