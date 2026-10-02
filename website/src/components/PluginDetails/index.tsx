// Plugin detail page. One route per plugin (/plugins/<slug>) is
// created by the catalogue plugin's addRoute; the full catalogue entry —
// README included — arrives as the `entry` route module.
import Link from '@docusaurus/Link';
import type { TOCItem } from '@docusaurus/mdx-loader';
import { useWindowSize } from '@docusaurus/theme-common';
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
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import MDXA from '@theme/MDXComponents/A';
import MDXCode from '@theme/MDXComponents/Code';
import MDXImg from '@theme/MDXComponents/Img';
import MDXLi from '@theme/MDXComponents/Li';
import MDXUl from '@theme/MDXComponents/Ul';
import TOC from '@theme/TOC';
import TOCCollapsible from '@theme/TOCCollapsible';
import GithubSlugger from 'github-slugger';
import React, { useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// The two heading levels the right-hand table of contents lists.
const TOC_MIN_HEADING_LEVEL = 2;
const TOC_MAX_HEADING_LEVEL = 3;

/** The page's own last section, listed in the table of contents like the rest. */
const METADATA_HEADING = 'Metadata';

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
	/** Every listed heading of the page, in reading order, for `@theme/TOC`. */
	toc: TOCItem[];
	/**
	 * Heading text to anchor id. Built here, in document order, with one
	 * slugger, so the ids the headings render with are the ids the table of
	 * contents links to — react-markdown renders each section on its own and
	 * cannot be relied on for ordering.
	 */
	headingIds: Map<string, string>;
}

interface FenceLine {
	line: string;
	heading: boolean;
}

/** The text of a Markdown ATX heading line, without its hashes. */
function headingText(line: string): string {
	return line.replace(/^#{1,6}\s+/, '').replace(/\s+#*\s*$/, '').trim();
}

/** Level of a Markdown ATX heading line: the number of leading hashes. */
function headingLevel(line: string): number {
	return (/^(#{1,6})/.exec(line)?.[1] ?? '').length;
}

/** ATX headings of a Markdown string, in reading order, ignoring code fences. */
function listedHeadings(markdown: string): { text: string; level: number }[] {
	let inFence = false;
	const headings: { text: string; level: number }[] = [];
	for (const line of markdown.split('\n')) {
		if (/^\s*(```|~~~)/.test(line)) {
			inFence = !inFence;
			continue;
		}
		if (!inFence && /^#{1,6}\s/.test(line)) {
			headings.push({ text: headingText(line), level: headingLevel(line) });
		}
	}
	return headings;
}

// The README is the page body, rendered as published; only its H1 is dropped —
// the page header already shows the title. The Installation section's H3
// subsections (### npm / ### CDN) are lifted into a tab switcher; when a
// README does not follow that structure, the section renders as plain text,
// so the page never breaks on content it does not recognise.
//
// Headings also get linkable ids and a table-of-contents entry, including the
// synthetic "Installation" and "Metadata" headings the page adds of its own.
// The `### npm` / `### CDN` tab labels deliberately get neither: which one is
// on screen is a UI state, so an anchor to one of them would mislead.
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

	const sections = splitInstallSection(lines);
	return { ...sections, ...buildToc(sections) };
}

/** The README split into the part before the Installation section, that section, and the rest. */
function splitInstallSection(lines: FenceLine[]): Pick<ParsedReadme, 'before' | 'install' | 'after'> {
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

	const heading = headingText(lines[installStart].line);
	const before = lines.slice(0, installStart).map((e: FenceLine) => e.line).join('\n').trim();
	const after = lines.slice(installEnd).map((e: FenceLine) => e.line).join('\n').trim();
	const installLines = lines.slice(installStart + 1, installEnd);

	const tabs: InstallTab[] = [];
	let current: InstallTab | null = null;
	const preamble: string[] = [];
	for (const entry of installLines) {
		const subheading = entry.heading ? /^### (.+)$/.exec(entry.line) : null;
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
		// Unexpected structure: keep the section inline, in reading order. Its
		// subheadings are then ordinary headings and are listed as such.
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

/**
 * Numbers the page's headings in reading order — the README before the
 * Installation section, the section's own heading, the rest of the README, and
 * the page's own Metadata heading — with one slugger, so that a repeated
 * heading text gets the `-1` suffix GitHub would give it.
 */
function buildToc(
	sections: Pick<ParsedReadme, 'before' | 'install' | 'after'>
): Pick<ParsedReadme, 'toc' | 'headingIds'> {
	const slugger = new GithubSlugger();
	const headingIds = new Map<string, string>();
	const toc: TOCItem[] = [];
	const add = ({ text, level }: { text: string; level: number }): void => {
		const id = slugger.slug(text);
		// First occurrence wins: the rendered heading looks its id up by text.
		if (!headingIds.has(text)) {
			headingIds.set(text, id);
		}
		if (level >= TOC_MIN_HEADING_LEVEL && level <= TOC_MAX_HEADING_LEVEL) {
			toc.push({ value: text, id, level });
		}
	};

	listedHeadings(sections.before).forEach(add);
	if (sections.install) {
		add({ text: sections.install.heading, level: 2 });
	}
	listedHeadings(sections.after).forEach(add);
	add({ text: METADATA_HEADING, level: 2 });

	return { toc, headingIds };
}

/**
 * The README is rendered with the site's own MDX components, so a code fence
 * becomes a real `@theme/CodeBlock` (highlighting, copy button, the theme's
 * dark palette) and inline code, links, lists and images match the rest of the
 * docs. react-markdown 10 passes the mdast `node` down as a prop; the theme
 * components spread what they get onto a DOM element, so it is dropped here.
 */
function withoutNode<P extends object>(
	Component: React.ComponentType<P>
): (props: P & { node?: unknown }) => React.JSX.Element {
	// `node` is destructured only to keep it out of `rest`.
	const Forwarded = ({ node, ...rest }: P & { node?: unknown }): React.JSX.Element => (
		<Component {...(rest as P)} />
	);
	Forwarded.displayName = `Markdown(${Component.displayName ?? Component.name})`;
	return Forwarded;
}

/**
 * Linkable headings, with the ids `parseReadme` assigned in document order, so
 * a heading and its table-of-contents entry always agree. `@theme/Heading` adds
 * the hash anchor; the site's swizzled MDXComponents headings are not used
 * because they hook into providers only the docs plugin sets up.
 */
function markdownComponents(headingIds: Map<string, string>): Components {
	const heading = (as: 'h2' | 'h3' | 'h4') => {
		// `node` is destructured only to keep it out of `rest`.
		const MarkdownHeading = ({ node, children, ...rest }: {
			node?: unknown;
			children?: React.ReactNode;
		}): React.JSX.Element => {
			const text = React.Children.toArray(children)
				.filter((child: React.ReactNode) => typeof child === 'string')
				.join('')
				.trim();
			return (
				<Heading as={as} id={headingIds.get(text)} {...rest}>
					{children}
				</Heading>
			);
		};
		MarkdownHeading.displayName = `MarkdownHeading(${as})`;
		return MarkdownHeading;
	};

	// CodeBlock draws its own <pre>, so the wrapper is dropped.
	const MarkdownPre = ({ children }: { children?: React.ReactNode }): React.JSX.Element => (
		<>{children}</>
	);
	MarkdownPre.displayName = 'MarkdownPre';

	const components: Components = {
		code: withoutNode(MDXCode),
		pre: MarkdownPre,
		a: withoutNode(MDXA),
		ul: withoutNode(MDXUl),
		li: withoutNode(MDXLi),
		img: withoutNode(MDXImg),
		h2: heading('h2'),
		h3: heading('h3'),
		h4: heading('h4'),
	};
	return components;
}

/** The README body, or one section of it, rendered as the docs render Markdown. */
function Readme({
	children,
	components,
}: {
	children: string;
	components: Components;
}): React.JSX.Element {
	return (
		<div className={`markdown ${styles.readme}`}>
			<ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
				{children}
			</ReactMarkdown>
		</div>
	);
}

function InstallTabs({
	install,
	components,
	headingIds,
}: {
	install: InstallSectionData;
	components: Components;
	headingIds: Map<string, string>;
}): React.JSX.Element {
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
			<Heading as="h2" id={headingIds.get(heading)}>
				{heading}
			</Heading>
			{preamble && <Readme components={components}>{preamble}</Readme>}
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
				>
					<Readme components={components}>{tab.body}</Readme>
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

/**
 * The plugin running for real, framed from its own package. `previewUrl` is the
 * page built for this frame; `demoUrl` is the full demo, which is framed when a
 * package declares no preview and is always offered as a link. Neither exists
 * for an entry with no workspace package behind it, which falls back to the
 * curated illustration.
 */
function PreviewBlock({ plugin }: { plugin: Plugin }): React.JSX.Element {
	const illustration = useBaseUrl(`/plugin-catalog/${plugin.previewImage}`);
	// Resolved unconditionally: hooks cannot sit behind the null checks below.
	const demoHref = useBaseUrl(plugin.demoUrl ?? '/plugins');
	const framed = plugin.previewUrl ?? plugin.demoUrl;

	return (
		<div className={styles.previewBlock}>
			<div className={styles.previewChart} style={{ height: plugin.previewHeight }}>
				{framed === null ? (
					<img
						className={styles.previewOverlay}
						src={illustration}
						alt={`${plugin.name} preview illustration`}
						onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
							e.currentTarget.hidden = true;
						}}
					/>
				) : (
					<PluginExample
						url={framed}
						name={plugin.name}
						bare
						height={plugin.previewHeight}
					/>
				)}
			</div>
			<div className={styles.previewCaption}>
				{framed === null ? (
					'Illustrative preview.'
				) : (
					<>
						Interactive example &mdash; the real plugin running on a live chart. Scroll,
						zoom, and hover.
						{plugin.demoUrl !== null && (
							<>
								{' '}
								<a
									className={styles.previewDemoLink}
									href={demoHref}
									target="_blank"
									rel="noopener noreferrer"
								>
									Open the full demo
									<ExternalIcon />
								</a>
							</>
						)}
					</>
				)}
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

/** Everything the page says about the entry's state before the README starts. */
function DetailNotices({
	plugin,
	registry,
}: {
	plugin: Plugin;
	registry: string | null;
}): React.JSX.Element {
	return (
		<>
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
		</>
	);
}

function DetailContent({ entry }: { entry: CatalogueEntry }): React.JSX.Element {
	const { siteConfig } = useDocusaurusContext();
	const { registry } = usePluginCatalogue();
	const buildTime = siteConfig.customFields?.catalogueBuildTime as number;
	const plugin = normalise(entry, buildTime);
	const { before, install, after, toc, headingIds } = parseReadme(entry.readme);
	const components = markdownComponents(headingIds);
	// The same split DocItem/Layout uses: the sidebar TOC on desktop (and in
	// the server render, so it is in the HTML), the collapsible one on mobile.
	const windowSize = useWindowSize();
	const showSidebarToc = toc.length > 0 && (windowSize === 'desktop' || windowSize === 'ssr');
	const showCollapsibleToc = toc.length > 0 && windowSize === 'mobile';

	return (
		<main className={styles.detail}>
			<Link className={styles.backLink} to="/plugins">
				&larr; Back to plugin catalog
			</Link>

			<DetailHeader plugin={plugin} />

			<DetailNotices plugin={plugin} registry={registry} />
			<PreviewBlock plugin={plugin} />

			<div className="row">
				<div className={`col ${styles.detailBody}`}>
					{showCollapsibleToc && (
						<TOCCollapsible
							toc={toc}
							minHeadingLevel={TOC_MIN_HEADING_LEVEL}
							maxHeadingLevel={TOC_MAX_HEADING_LEVEL}
							className={styles.tocMobile}
						/>
					)}

					{before && (
						<section className={styles.section}>
							<Readme components={components}>{before}</Readme>
						</section>
					)}

					{install && (
						<InstallTabs install={install} components={components} headingIds={headingIds} />
					)}

					{after && (
						<section className={styles.section}>
							<Readme components={components}>{after}</Readme>
						</section>
					)}

					<section className={styles.section}>
						<Heading as="h2" id={headingIds.get(METADATA_HEADING)}>
							{METADATA_HEADING}
						</Heading>
						<MetaTable plugin={plugin} tags={entry.lwcPlugin.tags} />
					</section>
				</div>

				{showSidebarToc && (
					<div className="col col--3">
						<TOC
							toc={toc}
							minHeadingLevel={TOC_MIN_HEADING_LEVEL}
							maxHeadingLevel={TOC_MAX_HEADING_LEVEL}
							className={styles.tocDesktop}
						/>
					</div>
				)}
			</div>
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
