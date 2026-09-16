// Plugin catalogue grid — Docusaurus-native page rendered inside
// the site Layout. Data comes from the `lwc-plugin-catalogue` plugin through
// usePluginCatalogue(); entries exist only for published packages.
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { usePluginCatalogue } from '@site/src/hooks/use-plugin-catalogue';
import Layout from '@theme/Layout';
import React, { useState } from 'react';

import styles from './styles.module.css';
import { CATEGORY_ORDER, normalise, type CatalogueEntrySummary, type Plugin } from './_data';

function StatusBadge({ status }: { status: string }): React.JSX.Element | null {
	if (status === 'new') {
		return <span className={styles.badgeNew}>New</span>;
	}
	if (status === 'pending') {
		return <span className={styles.badgeVersion}>Release pending</span>;
	}
	if (status === 'experimental') {
		return <span className={styles.badgeVersion}>Experimental</span>;
	}
	if (status === 'legacy') {
		return <span className={styles.badgeVersion}>Legacy</span>;
	}
	if (status === 'deprecated') {
		return <span className={styles.badgeDeprecated}>Deprecated</span>;
	}
	return null;
}

function PluginCard({ plugin }: { plugin: Plugin }): React.JSX.Element {
	const previewUrl = useBaseUrl(`/plugin-catalog/${plugin.previewImage}`);
	return (
		<Link
			className={plugin.status === 'deprecated' ? styles.cardDeprecated : styles.card}
			to={`/plugins/${plugin.slug}`}
		>
			<div className={styles.cardPreview}>
				<img
					src={previewUrl}
					alt=""
					loading="lazy"
					onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
						// A plugin without a curated preview keeps the empty frame
						// instead of a broken-image placeholder.
						e.currentTarget.hidden = true;
					}}
				/>
			</div>
			<div className={styles.cardBody}>
				<div className={styles.titleRow}>
					<h3>{plugin.name}</h3>
					<StatusBadge status={plugin.status} />
				</div>
				<p className={styles.desc}>{plugin.description}</p>
				<div className={styles.metaRow}>
					<span className={styles.tag}>{plugin.category}</span>
				</div>
			</div>
		</Link>
	);
}

interface FilterGroupProps {
	title: string;
	options: string[];
	active: string;
	countFor: (option: string) => number;
	onSelect: (option: string) => void;
	allLabel?: string;
}

function FilterGroup({ title, options, active, countFor, onSelect, allLabel }: FilterGroupProps): React.JSX.Element {
	return (
		<div className={styles.sidebarGroup}>
			<div className={styles.groupTitle}>{title}</div>
			<ul className={styles.filterList}>
				{options.map((option: string) => (
					<li key={option}>
						<button
							type="button"
							className={option === active ? styles.filterBtnActive : styles.filterBtn}
							onClick={() => onSelect(option)}
						>
							<span>{option === 'All' && allLabel ? allLabel : option}</span>
							<span className={styles.count}>{countFor(option)}</span>
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

export default function PluginCatalogPage(): React.JSX.Element {
	const catalogue = usePluginCatalogue();
	// Hooks stay unconditional; this link is only rendered by the empty state.
	const galleryUrl = useBaseUrl('/plugin-examples/');
	const { siteConfig } = useDocusaurusContext();
	const buildTime = siteConfig.customFields?.catalogueBuildTime as number;
	const [category, setCategory] = useState('All');
	const [query, setQuery] = useState('');

	// Entries arrive sorted by title; accessibility leads the grid deliberately.
	const base = catalogue.plugins.map((p: CatalogueEntrySummary) => normalise(p, buildTime));
	const pool = [
		...base.filter((p: Plugin) => p.slug === 'accessibility'),
		...base.filter((p: Plugin) => p.slug !== 'accessibility'),
	];

	const present = Array.from(new Set(pool.map((p: Plugin) => p.category)));
	present.sort((a: string, b: string) => {
		const ia = CATEGORY_ORDER.indexOf(a);
		const ib = CATEGORY_ORDER.indexOf(b);
		return (ia === -1 ? CATEGORY_ORDER.length : ia) - (ib === -1 ? CATEGORY_ORDER.length : ib);
	});
	const categories = ['All', ...present];

	const visible = pool.filter((p: Plugin) => {
		if (category !== 'All' && p.category !== category) {
			return false;
		}
		if (!query) {
			return true;
		}
		const haystack = [p.name, p.slug, p.description, p.category, p.publisher.name ?? '', ...p.searchTerms]
			.join(' ')
			.toLowerCase();
		return haystack.includes(query.trim().toLowerCase());
	});

	return (
		<Layout title="Plugins" description="Official plugins for Lightweight Charts™">
			<main className={styles.catalog}>
				<div className={styles.intro}>
					<h1>Plugin catalog</h1>
					<p>
						Official plugins that extend Lightweight Charts&trade; with new series types, drawing
						tools, and UX helpers.
					</p>
					{catalogue.registry === null && pool.length > 0 && (
						<p className={styles.noticePreview}>
							Preview data &mdash; these packages are not published yet.
						</p>
					)}
				</div>

				{pool.length === 0 ? (
					<section className={styles.emptyCatalog}>
						<div className={styles.empty}>
							<p>The first plugin packages are on their way — check back soon.</p>
							<p>
								In the meantime, the{' '}
								<a href={galleryUrl}>plugin examples gallery</a>{' '}
								shows what plugins can do.
							</p>
						</div>
					</section>
				) : (
					<>
						<aside>
							<FilterGroup
								title="Categories"
								options={categories}
								active={category}
								onSelect={setCategory}
								allLabel="All plugins"
								countFor={(option: string) =>
									option === 'All'
										? pool.length
										: pool.filter((p: Plugin) => p.category === option).length
								}
							/>
						</aside>

						<section>
							<div className={styles.searchRow}>
								<div className={styles.searchBox}>
									<span className={styles.searchIcon} aria-hidden="true">
										<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
											<circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
											<path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
										</svg>
									</span>
									<input
										type="search"
										className={styles.searchInput}
										placeholder="Search plugins by name or keyword…"
										aria-label="Search plugins"
										value={query}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
									/>
									{query && (
										<button
											type="button"
											className={styles.searchClear}
											aria-label="Clear search"
											onClick={() => setQuery('')}
										>
											✕
										</button>
									)}
								</div>
								<span className={styles.resultCount}>
									{visible.length} of {pool.length} plugins
								</span>
							</div>
							{visible.length > 0 ? (
								<div className={styles.grid}>
									{visible.map((p: Plugin) => (
										<PluginCard key={p.slug} plugin={p} />
									))}
								</div>
							) : (
								<div className={styles.empty}>
									<p>No plugins match your filters.</p>
									<button
										type="button"
										className="button button--link"
										onClick={() => {
											setCategory('All');
											setQuery('');
										}}
									>
										Clear search and filters
									</button>
								</div>
							)}
						</section>
					</>
				)}
			</main>
		</Layout>
	);
}
