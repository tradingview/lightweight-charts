// Examples gallery index, laid out like the plugin catalog and styled by the
// same stylesheet: categories on the left, a search box, and one card per
// example with a live preview. Categories and their order come from the
// `examples/` folder tree through the docs sidebar, so adding an example is
// adding a page; the gallery needs no list of its own.
import BrowserOnly from '@docusaurus/BrowserOnly';
import Link from '@docusaurus/Link';
import type { PropSidebarItemLink } from '@docusaurus/plugin-content-docs';
import { useDoc, useDocById } from '@docusaurus/plugin-content-docs/client';
import { useColorMode } from '@docusaurus/theme-common';
import { previewChartOptions, type PreviewLook } from '@site/plugins/enhanced-codeblock/theme/CodeBlock/preview';
import { prepareExampleScript } from '@theme/CodeBlock';
import { Chart } from '@theme/CodeBlock/chart';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { themeColors } from '../../../theme-colors';
import catalogStyles from '../../pages/plugins/styles.module.css';
import { type ExampleCategory, useExampleCategories } from './categories';
import { loadExampleSource } from './sources';
import styles from './styles.module.css';

const ALL = 'All';

interface PreviewLayer {
	script: string;
	previewOptions: Record<string, unknown>;
}

interface GalleryEntry {
	item: PropSidebarItemLink;
	category: string;
}

// Tells whether the element is near the viewport. A preview runs only while it
// is: the page does not start every chart at once, and a chart scrolled far
// away stops, along with any timers its example has started.
function useNearViewport(): [React.RefObject<HTMLDivElement>, boolean] {
	const ref = useRef<HTMLDivElement>(null);
	const [near, setNear] = useState(false);
	useEffect(
		() => {
			const element = ref.current;
			if (element === null) {
				return;
			}
			const observer = new IntersectionObserver(
				(entries: IntersectionObserverEntry[]) => setNear(entries[entries.length - 1].isIntersecting),
				{ rootMargin: '200px' }
			);
			observer.observe(element);
			return () => observer.disconnect();
		},
		[]
	);
	return [ref, near];
}

function LivePreview({ docId, showScales }: { docId: string; showScales: boolean }): React.JSX.Element {
	const { colorMode } = useColorMode();
	const [ref, near] = useNearViewport();
	const [source, setSource] = useState<string | null>(null);

	useEffect(
		() => {
			if (!near || source !== null) {
				return;
			}
			let cancelled = false;
			void loadExampleSource(docId)?.then((code: string) => {
				if (!cancelled) {
					setSource(code);
				}
			});
			return () => {
				cancelled = true;
			};
		},
		[near, docId, source]
	);

	const isDark = colorMode === 'dark';
	const previewOptions = useMemo(
		() => previewChartOptions(isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)', showScales),
		[isDark, showScales]
	);
	const look: PreviewLook = useMemo(
		() => ({ chartOptions: previewOptions, textColor: themeColors[isDark ? 'DARK' : 'LIGHT'].CHART_TEXT_COLOR }),
		[previewOptions, isDark]
	);
	const script = source === null ? null : prepareExampleScript(source, isDark);

	// A theme switch rebuilds the chart in the new colors. The chart already on
	// screen is restyled in them at once and stays under the new one until that
	// has settled and faded in, so the card never shows an empty frame.
	const [settled, setSettled] = useState<PreviewLayer | null>(null);
	useEffect(
		() => {
			if (!near) {
				setSettled(null);
			}
		},
		[near]
	);
	const current: PreviewLayer | null = script === null || !near ? null : { script, previewOptions };
	const layers = [settled, current].filter(
		(layer: PreviewLayer | null, index: number, all: (PreviewLayer | null)[]): layer is PreviewLayer =>
			layer !== null && (index === 0 ? layer.script !== all[1]?.script : true)
	);
	return (
		<div ref={ref} className={styles.livePreview} aria-hidden="true">
			{layers.map((layer: PreviewLayer) => (
				<div key={layer.script} className={styles.previewLayer}>
					<Chart
						script={layer.script}
						iframeStyle={{ height: '100%' }}
						previewOptions={layer.previewOptions}
						latestVersion
						onPreviewSettled={layer === current ? () => setSettled(layer) : undefined}
						previewLook={look}
					/>
				</div>
			))}
		</div>
	);
}

function ExampleCard({ entry }: { entry: GalleryEntry }): React.JSX.Element {
	const { item, category } = entry;
	const doc = useDocById(item.docId ?? undefined);
	return (
		<Link className={catalogStyles.card} to={item.href}>
			<div className={catalogStyles.cardPreview}>
				<BrowserOnly>
					{() => <LivePreview docId={item.docId as string} showScales={item.customProps?.previewScales === true} />}
				</BrowserOnly>
			</div>
			<div className={catalogStyles.cardBody}>
				<div className={catalogStyles.titleRow}>
					<h3>{item.label}</h3>
				</div>
				{doc?.description && <p className={catalogStyles.desc}>{doc.description}</p>}
				<div className={catalogStyles.metaRow}>
					<span className={catalogStyles.tag}>{category}</span>
				</div>
			</div>
		</Link>
	);
}

interface FilterGroupProps {
	options: string[];
	active: string;
	countFor: (option: string) => number;
	onSelect: (option: string) => void;
}

function FilterGroup({ options, active, countFor, onSelect }: FilterGroupProps): React.JSX.Element {
	return (
		<div className={catalogStyles.sidebarGroup}>
			<div className={catalogStyles.groupTitle}>Categories</div>
			<ul className={catalogStyles.filterList}>
				{options.map((option: string) => (
					<li key={option}>
						<button
							type="button"
							className={option === active ? catalogStyles.filterBtnActive : catalogStyles.filterBtn}
							onClick={() => onSelect(option)}
						>
							<span>{option === ALL ? 'All examples' : option}</span>
							<span className={catalogStyles.count}>{countFor(option)}</span>
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

function SearchBox({ query, onChange }: { query: string; onChange: (query: string) => void }): React.JSX.Element {
	return (
		<div className={catalogStyles.searchRow}>
			<div className={catalogStyles.searchBox}>
				<span className={catalogStyles.searchIcon} aria-hidden="true">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
						<path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
					</svg>
				</span>
				<input
					type="search"
					className={catalogStyles.searchInput}
					placeholder="Search examples by name or category…"
					aria-label="Search examples"
					value={query}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
				/>
				{query && (
					<button type="button" className={catalogStyles.searchClear} aria-label="Clear search" onClick={() => onChange('')}>
						&#x2715;
					</button>
				)}
			</div>
		</div>
	);
}

export default function ExamplesGallery(): React.JSX.Element {
	const { metadata } = useDoc();
	const categories = useExampleCategories();
	const [category, setCategory] = useState(ALL);
	const [query, setQuery] = useState('');

	const pool: GalleryEntry[] = categories.flatMap((c: ExampleCategory) =>
		c.examples.map((item: PropSidebarItemLink) => ({ item, category: c.label }))
	);
	const normalizedQuery = query.trim().toLowerCase();
	const visible = pool.filter((entry: GalleryEntry) => {
		if (category !== ALL && entry.category !== category) {
			return false;
		}
		return normalizedQuery === '' || [entry.item.label, entry.item.docId ?? '', entry.category].join(' ').toLowerCase().includes(normalizedQuery);
	});

	return (
		<main className={catalogStyles.catalog}>
			<div className={catalogStyles.intro}>
				<h1>{metadata.title}</h1>
				<p>{metadata.description}</p>
			</div>

			<aside>
				<FilterGroup
					options={[ALL, ...categories.map((c: ExampleCategory) => c.label)]}
					active={category}
					onSelect={setCategory}
					countFor={(option: string) =>
						option === ALL ? pool.length : pool.filter((entry: GalleryEntry) => entry.category === option).length
					}
				/>
			</aside>

			<section>
				<SearchBox query={query} onChange={setQuery} />
				{visible.length === 0 ? (
					<p className={catalogStyles.empty}>No examples match &ldquo;{query}&rdquo;.</p>
				) : (
					<div className={catalogStyles.grid}>
						{visible.map((entry: GalleryEntry) => (
							<ExampleCard key={entry.item.docId} entry={entry} />
						))}
					</div>
				)}
			</section>
		</main>
	);
}
