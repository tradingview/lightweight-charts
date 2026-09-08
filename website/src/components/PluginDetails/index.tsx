// Plugin detail page. One route per plugin (/plugins/<slug>) is
// created by the catalogue plugin's addRoute; the full catalogue entry —
// README included — arrives as the `entry` route module.
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import PluginExample from '@site/src/components/PluginExample';
import { usePluginCatalogue } from '@site/src/hooks/use-plugin-catalogue';
import styles from '@site/src/pages/plugins/styles.module.css';
import {
	formatPublishedAt,
	normalise,
	type CatalogueEntry,
	type Plugin,
} from '@site/src/pages/plugins/_data';
import Layout from '@theme/Layout';
import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Official plugins embed their real interactive example: the gallery copy
// deployed at /plugin-examples/plugins/<slug>/example/ (PluginExample builds
// that URL). Community plugins have no example in this repo, so they show
// their SVG illustration instead.
function hasGalleryExample(plugin: Plugin): boolean {
	return plugin.publisher.type === 'official';
}

interface InstallTab {
	label: string;
	body: string;
}

interface InstallSectionData {
	heading: string;
	preamble: string;
	tabs: InstallTab[];
}

interface ParsedReadme {
	before: string;
	install: InstallSectionData | null;
	after: string;
}

interface FenceLine {
	line: string;
	heading: boolean;
}

// The README is the page body, rendered as published; only its H1 is dropped —
// the page header already shows the title. The Installation section's H3
// subsections (### npm / ### CDN) are lifted into a tab switcher; when a
// README does not follow that structure, the section renders as plain text,
// so the page never breaks on content it does not recognise.
function parseReadme(readme: string): ParsedReadme {
	// Headings only count outside fenced code blocks.
	let inFence = false;
	const fenceAware = readme.split('\n').map((line: string) => {
		if (/^\s*(```|~~~)/.test(line)) {
			inFence = !inFence;
		}
		return { line, heading: !inFence && /^#/.test(line) };
	});

	const firstTitle = fenceAware.findIndex((e: FenceLine) => e.heading && /^# /.test(e.line));
	const lines = fenceAware.filter((entry: FenceLine, index: number) => index !== firstTitle);

	const installStart = lines.findIndex((e: FenceLine) => e.heading && /^## Installation\b/.test(e.line));
	if (installStart === -1) {
		return { before: lines.map((e: FenceLine) => e.line).join('\n').trim(), install: null, after: '' };
	}
	let installEnd = lines.length;
	for (let i = installStart + 1; i < lines.length; i += 1) {
		if (lines[i].heading && /^## /.test(lines[i].line)) {
			installEnd = i;
			break;
		}
	}

	const heading = lines[installStart].line.replace(/^## /, '');
	const before = lines.slice(0, installStart).map((e: FenceLine) => e.line).join('\n').trim();
	const after = lines.slice(installEnd).map((e: FenceLine) => e.line).join('\n').trim();
	const installLines = lines.slice(installStart + 1, installEnd);

	const tabs: InstallTab[] = [];
	let current: InstallTab | null = null;
	const preamble: string[] = [];
	for (const entry of installLines) {
		const subheading = entry.heading ? entry.line.match(/^### (.+)$/) : null;
		if (subheading) {
			current = { label: subheading[1], body: '' };
			tabs.push(current);
		} else if (current) {
			current.body += `${entry.line}\n`;
		} else {
			preamble.push(entry.line);
		}
	}

	if (tabs.length < 2) {
		// Unexpected structure: keep the section inline, in reading order.
		const inline = [`## ${heading}`, ...installLines.map((e: FenceLine) => e.line)].join('\n').trim();
		return { before: `${before}\n\n${inline}`.trim(), install: null, after };
	}
	return {
		before,
		install: {
			heading,
			preamble: preamble.join('\n').trim(),
			tabs: tabs.map((tab: InstallTab) => ({ label: tab.label, body: tab.body.trim() })),
		},
		after,
	};
}

function InstallTabs({ install }: { install: InstallSectionData }): React.JSX.Element {
	const { heading, preamble, tabs } = install;
	const [active, setActive] = useState(0);
	const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

	const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
		const last = tabs.length - 1;
		let next: number | null = null;
		if (event.key === 'ArrowRight') {
			next = active === last ? 0 : active + 1;
		} else if (event.key === 'ArrowLeft') {
			next = active === 0 ? last : active - 1;
		} else if (event.key === 'Home') {
			next = 0;
		} else if (event.key === 'End') {
			next = last;
		}
		if (next !== null) {
			event.preventDefault();
			setActive(next);
			tabRefs.current[next]?.focus();
		}
	};

	return (
		<section className={styles.section}>
			<h2>{heading}</h2>
			{preamble && (
				<div className={`markdown ${styles.readme}`}>
					<ReactMarkdown remarkPlugins={[remarkGfm]}>{preamble}</ReactMarkdown>
				</div>
			)}
			<div className={styles.tabs} role="tablist" aria-label={heading} onKeyDown={onKeyDown}>
				{tabs.map((tab: InstallTab, index: number) => (
					<button
						key={tab.label}
						ref={(el: HTMLButtonElement | null) => {
							tabRefs.current[index] = el;
						}}
						type="button"
						role="tab"
						id={`install-tab-${index}`}
						aria-selected={index === active}
						aria-controls={`install-panel-${index}`}
						tabIndex={index === active ? 0 : -1}
						className={index === active ? styles.tabActive : styles.tab}
						onClick={() => setActive(index)}
					>
						{tab.label}
					</button>
				))}
			</div>
			{tabs.map((tab: InstallTab, index: number) => (
				// Every panel is server-rendered (searchable, visible without
				// JS); only the inactive ones are hidden.
				<div
					key={tab.label}
					id={`install-panel-${index}`}
					role="tabpanel"
					aria-labelledby={`install-tab-${index}`}
					hidden={index !== active}
					className={`markdown ${styles.readme}`}
				>
					<ReactMarkdown remarkPlugins={[remarkGfm]}>{tab.body}</ReactMarkdown>
				</div>
			))}
		</section>
	);
}

// External links carry an icon per the TV DS Links sheet.
function ExternalIcon(): React.JSX.Element {
	return (
		<svg
			className={styles.externalIcon}
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M4.5 2.5H2.75c-.69 0-1.25.56-1.25 1.25v5.5c0 .69.56 1.25 1.25 1.25h5.5c.69 0 1.25-.56 1.25-1.25V7.5"
				stroke="currentColor"
				strokeWidth="1.2"
				strokeLinecap="round"
			/>
			<path d="M7 1.5h3.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
			<path d="M10.3 1.7 5.75 6.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
		</svg>
	);
}

function PreviewBlock({ plugin }: { plugin: Plugin }): React.JSX.Element {
	const previewUrl = useBaseUrl(`/plugin-catalog/${plugin.previewImage}`);
	// The gallery page is expected for official plugins but verified at
	// runtime: when it is missing, the block falls back to the illustration
	// instead of framing a 404 page.
	const [demoMissing, setDemoMissing] = useState(false);
	const withExample = hasGalleryExample(plugin) && !demoMissing;

	return (
		<div className={styles.previewBlock}>
			<div className={styles.previewChart}>
				{withExample ? (
					<PluginExample
						id={plugin.slug}
						name={plugin.name}
						bare
						height={330}
						onMissing={() => setDemoMissing(true)}
					/>
				) : (
					<img
						className={styles.previewOverlay}
						src={previewUrl}
						alt={`${plugin.name} preview illustration`}
						onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
							e.currentTarget.hidden = true;
						}}
					/>
				)}
			</div>
			<div className={styles.previewCaption}>
				{withExample
					? 'Interactive example — the real plugin running on a live chart. Scroll, zoom, and hover.'
					: 'Illustrative preview.'}
			</div>
		</div>
	);
}

function StatusBadges({ plugin }: { plugin: Plugin }): React.JSX.Element {
	return (
		<div className={styles.badgesRow}>
			{plugin.status === 'new' && <span className={styles.badgeNew}>New</span>}
			{plugin.status === 'deprecated' && <span className={styles.badgeDeprecated}>Deprecated</span>}
			{plugin.status === 'pending' && <span className={styles.badgeVersion}>Release pending</span>}
			{plugin.status === 'experimental' && <span className={styles.badgeVersion}>Experimental</span>}
			{plugin.status === 'legacy' && <span className={styles.badgeVersion}>Legacy</span>}
			{plugin.status === 'stable' && <span className={styles.badgeStable}>Stable</span>}
			<span className={styles.tag}>{plugin.category}</span>
			{plugin.peerRange && (
				<span className={styles.badgeVersion}>
					Works with lightweight-charts {plugin.peerRange}
				</span>
			)}
			<span className={styles.badgeVersion}>v{plugin.version}</span>
		</div>
	);
}

function DetailHeader({ plugin }: { plugin: Plugin }): React.JSX.Element {
	return (
		<header className={styles.detailHeader}>
			<h1>{plugin.name}</h1>
			<p className={styles.byline}>
				{plugin.publisher.name && <>By {plugin.publisher.name} &middot; </>}
				{plugin.publisher.type === 'official' ? 'Official' : 'Community'}
			</p>
			<StatusBadges plugin={plugin} />
			<p className={styles.detailDesc}>{plugin.description}</p>
			<div className={styles.detailLinks}>
				{plugin.repository && (
					<a href={plugin.repository} target="_blank" rel="noopener noreferrer">
						Source on GitHub
						<ExternalIcon />
					</a>
				)}
				<a href={plugin.npmUrl} target="_blank" rel="noopener noreferrer">
					View on npm
					<ExternalIcon />
				</a>
			</div>
		</header>
	);
}

function MetaTable({ plugin, tags }: { plugin: Plugin; tags: string[] }): React.JSX.Element {
	const repoLabel = plugin.repository?.replace(/^https:\/\/github\.com\//, '');
	const published = formatPublishedAt(plugin.publishedAt);
	return (
		<table className={styles.metaTable}>
			<tbody>
				<tr>
					<td>Publisher</td>
					<td>
						{plugin.publisher.name
							? `${plugin.publisher.name} (${plugin.publisher.type})`
							: plugin.publisher.type}
					</td>
				</tr>
				<tr>
					<td>npm package</td>
					<td>
						<a href={plugin.npmUrl} target="_blank" rel="noopener noreferrer">
							<code>{plugin.npmPackage}</code>
						</a>
					</td>
				</tr>
				<tr>
					<td>Version</td>
					<td>
						{plugin.version}
						{plugin.pendingVersion && <> (v{plugin.pendingVersion} pending release)</>}
					</td>
				</tr>
				{plugin.peerRange && (
					<tr>
						<td>Supported range</td>
						<td>lightweight-charts {plugin.peerRange}</td>
					</tr>
				)}
				<tr>
					<td>Plugin type</td>
					<td>
						<code>{plugin.techCategory}</code>
					</td>
				</tr>
				<tr>
					<td>License</td>
					<td>{plugin.license}</td>
				</tr>
				{published && (
					<tr>
						<td>Published</td>
						<td>{published}</td>
					</tr>
				)}
				<tr>
					<td>Tags</td>
					<td>
						{tags.map((k: string) => (
							<span key={k} className={styles.tag} style={{ marginRight: 4 }}>
								{k}
							</span>
						))}
					</td>
				</tr>
				{plugin.repository && (
					<tr>
						<td>Repository</td>
						<td>
							<a href={plugin.repository} target="_blank" rel="noopener noreferrer">
								{repoLabel}
								<ExternalIcon />
							</a>
						</td>
					</tr>
				)}
			</tbody>
		</table>
	);
}

function DetailContent({ entry }: { entry: CatalogueEntry }): React.JSX.Element {
	const { siteConfig } = useDocusaurusContext();
	const { registry } = usePluginCatalogue();
	const buildTime = siteConfig.customFields?.catalogueBuildTime as number;
	const plugin = normalise(entry, buildTime);
	const { before, install, after } = parseReadme(entry.readme);

	return (
		<main className={styles.detail}>
			<Link className={styles.backLink} to="/plugins">
				&larr; Back to plugin catalog
			</Link>

			<DetailHeader plugin={plugin} />

			{registry === null && (
				<p className={styles.noticePreview}>
					Preview data &mdash; this package is not published yet.
				</p>
			)}

			{plugin.status === 'deprecated' && (
				<p className={styles.noticeDeprecated}>
					<strong>Deprecated.</strong>{' '}
					{plugin.deprecatedMessage ??
						'This plugin is no longer maintained and may not work with the latest version of Lightweight Charts.'}
				</p>
			)}
			{plugin.status === 'pending' && plugin.pendingVersion && (
				<p className={styles.hint}>
					Version {plugin.pendingVersion} is merged and awaiting its npm release; the page
					describes the published v{plugin.version}.
				</p>
			)}
			<PreviewBlock plugin={plugin} />

			{before && (
				<section className={styles.section}>
					<div className={`markdown ${styles.readme}`}>
						<ReactMarkdown remarkPlugins={[remarkGfm]}>{before}</ReactMarkdown>
					</div>
				</section>
			)}

			{install && <InstallTabs install={install} />}

			{after && (
				<section className={styles.section}>
					<div className={`markdown ${styles.readme}`}>
						<ReactMarkdown remarkPlugins={[remarkGfm]}>{after}</ReactMarkdown>
					</div>
				</section>
			)}

			<section className={styles.section}>
				<h2>Metadata</h2>
				<MetaTable plugin={plugin} tags={entry.lwcPlugin.tags} />
			</section>
		</main>
	);
}

export default function PluginDetailsPage({ entry }: { entry: CatalogueEntry }): React.JSX.Element {
	return (
		<Layout
			title={`${entry.lwcPlugin.title} — Plugins`}
			description={entry.description}
		>
			<DetailContent entry={entry} />
		</Layout>
	);
}
