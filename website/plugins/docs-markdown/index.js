// @ts-check

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, posix, relative as relativePath } from 'node:path';

import logger from '@docusaurus/logger';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { mdxjs } from 'micromark-extension-mdxjs';

import { cleanCodeSample, collectBindings, pageDirectory, renderMdxComponent } from './components.js';

/**
 * @typedef {import('./components.js').MdastNode} MdastNode
 * @typedef {import('./components.js').ComponentReplacement} ComponentReplacement
 * @typedef {import('./components.js').MdxComponentContext} MdxComponentContext
 */

const DOCS_PLUGIN_NAME = 'docusaurus-plugin-content-docs';

/**
 * The parts of the site that are exported as Markdown, in the order they appear
 * in the map. Each one names the content-docs instance it comes from, the
 * sidebar that gives its structure (the API reference has its own
 * `typedocSidebar`, which we intentionally ignore), and how its version is
 * chosen: the documentation is versioned and only the released version is
 * exported, while the tutorials have a single version.
 *
 * @typedef {object} ExportedSection
 * @property {string} pluginId
 * @property {string} sidebar
 * @property {string} heading
 * @property {(version: LoadedVersion) => boolean} pickVersion
 */

/** @type {ExportedSection[]} */
const EXPORTED_SECTIONS = [
	{
		pluginId: 'default',
		sidebar: 'docsSidebar',
		heading: 'Documentation',
		pickVersion: version => version.isLast === true,
	},
	{
		pluginId: 'tutorials',
		sidebar: 'tutorialsSidebar',
		heading: 'Tutorials',
		pickVersion: version => version.versionName === 'current',
	},
];

// The API reference is generated from the type definitions by TypeDoc, page per
// symbol. Those pages are left out of the export; the definitions they are
// generated from are published whole instead (see below), which is both smaller
// and more complete for a machine reader.
const API_ROUTE_SEGMENT = 'api';

// TypeScript definitions of the released version, downloaded by the site config
// and used to generate the API reference. Copied to the site root under a name
// that says what it is.
const TYPE_DEFINITIONS_FILE = 'lightweight-charts.d.ts';
const TYPINGS_CACHE_DIR = '.previous-typings-cache';

// The branch the repository serves its files from, for the few embedded files
// the build rewrites and so cannot be linked in the site itself.
const DEFAULT_BRANCH = 'master';

/**
 * Public site root (e.g. `https://tradingview.github.io/lightweight-charts`),
 * derived from the build config so local builds emit their own URLs rather than
 * production ones.
 *
 * @param {string} siteUrl
 * @param {string} baseUrl
 * @returns {string}
 */
function siteRootUrl(siteUrl, baseUrl) {
	return `${siteUrl.replace(/\/+$/, '')}${baseUrl.replace(/\/+$/, '')}`;
}

// ---------------------------------------------------------------------------
// Minimal shapes of the parts of the content-docs plugin output we depend on.
// (The full types live in @docusaurus/plugin-content-docs; we only need these.)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} DocMetadata
 * @property {string} id
 * @property {string} title
 * @property {string} source `@site/versioned_docs/version-5.2/panes.md`
 * @property {string} permalink `/lightweight-charts/docs/panes`
 */

/**
 * @typedef {object} LoadedVersion
 * @property {string} versionName
 * @property {boolean} [isLast]
 * @property {string} contentPath Absolute path of the folder the version's pages are read from.
 * @property {DocMetadata[]} docs
 * @property {Record<string, SidebarItem[]>} sidebars
 */

/** @typedef {{ type: string, id?: string, label?: string, items?: SidebarItem[], link?: { type: string, id?: string } }} SidebarItem */

/**
 * In-memory model of a sidebar, resolved to titles/permalinks in real order.
 *
 * @typedef {{ kind: 'doc', title: string, permalink: string, source: string, contentRoot: string }} DocNode
 * @typedef {{ kind: 'category', label: string, children: DocsNode[] }} CategoryNode
 * @typedef {DocNode | CategoryNode} DocsNode
 */

/** @typedef {{ depth: number, text: string }} Heading */

/**
 * A range of the source to drop, optionally replaced by generated Markdown
 * (the content an MDX component renders).
 *
 * @typedef {{ start: number, end: number, text?: string }} Edit
 */

/**
 * @param {string} permalink
 * @param {string} baseUrl
 * @returns {string}
 */
function toRoute(permalink, baseUrl) {
	let route = permalink;
	if (baseUrl !== '/' && route.startsWith(baseUrl)) {
		route = route.slice(baseUrl.length);
	}
	return route.replace(/^\/+/, '').replace(/\/+$/, '');
}

/**
 * @param {string} permalink
 * @param {string} baseUrl
 * @returns {boolean}
 */
function isApiPage(permalink, baseUrl) {
	return toRoute(permalink, baseUrl).split('/').includes(API_ROUTE_SEGMENT);
}

/**
 * The doc-root-relative, extension-less form of a doc's `source`
 * (`@site/tutorials/a/b.mdx` -> `tutorials/a/b`). Used to map a resolved
 * relative link back to the target page's permalink.
 *
 * @param {string} source
 * @returns {string}
 */
function sourceKey(source) {
	return source.replace(/^@site[\\/]?/, '').replace(/\\/g, '/').replace(/\.mdx?$/, '');
}

/**
 * @param {DocMetadata} doc
 * @param {string} baseUrl
 * @param {string} contentRoot
 * @returns {DocNode | null}
 */
function toDocNode(doc, baseUrl, contentRoot) {
	if (isApiPage(doc.permalink, baseUrl)) {
		return null;
	}
	return { kind: 'doc', title: doc.title, permalink: doc.permalink, source: doc.source, contentRoot };
}

/**
 * @param {SidebarItem[]} items
 * @param {Map<string, DocMetadata>} docsById
 * @param {string} baseUrl
 * @param {string} contentRoot
 * @returns {DocsNode[]}
 */
function buildDocsNodes(items, docsById, baseUrl, contentRoot) {
	/** @type {DocsNode[]} */
	const nodes = [];
	for (const item of items) {
		const node = item.type === 'category'
			? buildCategoryNode(item, docsById, baseUrl, contentRoot)
			: buildDocItemNode(item, docsById, baseUrl, contentRoot);
		if (node !== null) {
			nodes.push(node);
		}
	}
	return nodes;
}

/**
 * @param {SidebarItem} item
 * @param {Map<string, DocMetadata>} docsById
 * @param {string} baseUrl
 * @param {string} contentRoot
 * @returns {CategoryNode | null}
 */
function buildCategoryNode(item, docsById, baseUrl, contentRoot) {
	if ((item.label ?? '').toLowerCase() === API_ROUTE_SEGMENT) {
		return null;
	}
	const children = buildDocsNodes(item.items ?? [], docsById, baseUrl, contentRoot);
	// Surface the category's own landing page as its first entry, so it is both
	// mapped and written out.
	const landingPage = item.link?.type === 'doc' && item.link.id !== undefined ? docsById.get(item.link.id) : undefined;
	const landingNode = landingPage === undefined ? null : toDocNode(landingPage, baseUrl, contentRoot);
	if (landingNode !== null) {
		children.unshift(landingNode);
	}
	return children.length === 0 ? null : { kind: 'category', label: item.label ?? '', children };
}

/**
 * @param {SidebarItem} item
 * @param {Map<string, DocMetadata>} docsById
 * @param {string} baseUrl
 * @param {string} contentRoot
 * @returns {DocNode | null}
 */
function buildDocItemNode(item, docsById, baseUrl, contentRoot) {
	if ((item.type !== 'doc' && item.type !== 'ref') || item.id === undefined) {
		return null;
	}
	const doc = docsById.get(item.id);
	return doc === undefined ? null : toDocNode(doc, baseUrl, contentRoot);
}

/**
 * Pages that sit at the root of a sidebar (Getting started, Panes, iOS…) have
 * no category of their own, and a page listed after a category would otherwise
 * read as if it belonged to it. Hoisting them keeps every page under the
 * heading it actually belongs to.
 *
 * @param {DocsNode[]} nodes
 * @returns {DocsNode[]}
 */
function hoistRootDocs(nodes) {
	return [
		...nodes.filter((/** @type {DocsNode} */ node) => node.kind === 'doc'),
		...nodes.filter((/** @type {DocsNode} */ node) => node.kind === 'category'),
	];
}

/**
 * @param {DocsNode[]} nodes
 * @param {DocNode[]} accumulator
 */
function collectDocNodes(nodes, accumulator) {
	for (const node of nodes) {
		if (node.kind === 'category') {
			collectDocNodes(node.children, accumulator);
		} else {
			accumulator.push(node);
		}
	}
}

/**
 * Drops nodes whose page was not actually written, so the map never links to a
 * missing .md.
 *
 * @param {DocsNode[]} nodes
 * @param {Set<string>} written
 * @returns {DocsNode[]}
 */
function pruneToWritten(nodes, written) {
	/** @type {DocsNode[]} */
	const result = [];
	for (const node of nodes) {
		if (node.kind === 'category') {
			const children = pruneToWritten(node.children, written);
			if (children.length > 0) {
				result.push({ kind: 'category', label: node.label, children });
			}
		} else if (written.has(node.permalink)) {
			result.push(node);
		}
	}
	return result;
}

// ---------------------------------------------------------------------------
// Markdown / MDX cleaning
// ---------------------------------------------------------------------------

/**
 * @param {string} raw
 * @returns {string}
 */
function stripFrontmatter(raw) {
	const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(raw);
	return match ? raw.slice(match[0].length) : raw;
}

const FENCED_BLOCK = /^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[^\n]*$/gm;

/**
 * Runs `transform` on the parts of `body` outside fenced code blocks (of any
 * fence length), so code samples are never rewritten. Inline `code` spans are
 * deliberately not protected: link labels are regularly written as
 * ``[`method`](…)``, and treating the label as code would split it from its URL
 * and leave the link unrewritten.
 *
 * @param {string} body
 * @param {(segment: string) => string} transform
 * @param {(block: string) => string} [transformBlock] Applied to each fenced block instead of keeping it verbatim.
 * @returns {string}
 */
function transformOutsideFences(body, transform, transformBlock) {
	const fence = new RegExp(FENCED_BLOCK.source, 'gm');
	let result = '';
	let lastIndex = 0;
	let match = fence.exec(body);
	while (match !== null) {
		result += transform(body.slice(lastIndex, match.index));
		result += transformBlock === undefined ? match[0] : transformBlock(match[0]);
		lastIndex = fence.lastIndex;
		match = fence.exec(body);
	}
	return result + transform(body.slice(lastIndex));
}

const MDX_REMOVE_WHOLE = new Set(['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression']);
const MDX_JSX = new Set(['mdxJsxFlowElement', 'mdxJsxTextElement']);

/**
 * @param {MdastNode} node
 * @returns {[number, number] | null}
 */
function nodeOffsets(node) {
	const start = node.position?.start.offset;
	const end = node.position?.end.offset;
	return typeof start === 'number' && typeof end === 'number' ? [start, end] : null;
}

/**
 * Text content of a node, ignoring MDX import/expression constructs so a
 * heading's trailing `{#anchor}` (an mdxTextExpression) never leaks in.
 *
 * @param {MdastNode} node
 * @returns {string}
 */
function nodeText(node) {
	if (MDX_REMOVE_WHOLE.has(node.type)) {
		return '';
	}
	if (typeof node.value === 'string') {
		return node.value;
	}
	return (node.children ?? []).map(nodeText).join('');
}

/**
 * @typedef {object} CleanupContext
 * @property {string} source
 * @property {Edit[]} edits
 * @property {Heading[]} headings
 * @property {MdxComponentContext} components
 */

/**
 * Walks the MDX AST, collecting (a) the source ranges to delete — ESM imports,
 * `{…}` expressions, and JSX tags (keeping their children) — together with the
 * Markdown that replaces the components which draw their own content, and
 * (b) the heading outline. Inline code and code blocks are never in the edit
 * set, so generic type arguments like `Partial<Foo>` survive verbatim.
 *
 * @param {MdastNode} node
 * @param {CleanupContext} ctx
 */
function collectCleanup(node, ctx) {
	if (MDX_REMOVE_WHOLE.has(node.type)) {
		const range = nodeOffsets(node);
		if (range) {
			ctx.edits.push({ start: range[0], end: range[1] });
		}
		return;
	}
	if (MDX_JSX.has(node.type)) {
		collectJsxCleanup(node, ctx);
		return;
	}
	if (node.type === 'heading' && typeof node.depth === 'number' && node.depth >= 2 && node.depth <= 4) {
		const text = nodeText(node).replace(/\s+/g, ' ').trim();
		if (text.length > 0) {
			ctx.headings.push({ depth: node.depth, text });
		}
	}
	for (const child of node.children ?? []) {
		collectCleanup(child, ctx);
	}
}

/**
 * @param {MdastNode} node
 * @param {CleanupContext} ctx
 */
function collectJsxCleanup(node, ctx) {
	const outer = nodeOffsets(node);
	if (outer === null) {
		return;
	}
	const replacement = renderMdxComponent(node, ctx.components);
	const children = node.children ?? [];
	// Either the component draws its own Markdown, or it has no children a
	// reader would see: both cases replace the element whole. (A renderer that
	// only wraps children has nothing to wrap here, and its opening delimiter
	// alone would corrupt the text.)
	if (replacement?.text !== undefined || children.length === 0) {
		ctx.edits.push({ start: outer[0], end: outer[1], text: replacement?.text });
		return;
	}
	unwrapJsxElement(node, children, outer, replacement, ctx);
}

/**
 * Drops the tags of a JSX element and keeps what they wrap.
 *
 * @param {MdastNode} node
 * @param {MdastNode[]} children
 * @param {[number, number]} outer
 * @param {ComponentReplacement | null} replacement
 * @param {CleanupContext} ctx
 */
function unwrapJsxElement(node, children, outer, replacement, ctx) {
	const first = nodeOffsets(children[0]);
	const last = nodeOffsets(children[children.length - 1]);
	if (first) {
		ctx.edits.push({ start: outer[0], end: first[0], text: replacement?.before }); // opening tag + attributes
	}
	if (last) {
		ctx.edits.push({ start: last[1], end: outer[1], text: replacement?.after }); // closing tag
	}
	const nestedFrom = ctx.edits.length;
	for (const child of children) {
		collectCleanup(child, ctx);
	}
	// Content nested in a JSX block is usually indented to match the tags. Once
	// the tags are gone that indentation turns lists into nested lists and
	// paragraphs into code blocks, so it goes with them.
	if (node.type === 'mdxJsxFlowElement' && first && last) {
		collectDedentEdits(ctx, first[0], last[1], nestedFrom);
	}
}

/**
 * Leading whitespace of the line starting at `lineStart`, or null for a line
 * that holds nothing else (a blank line has no indentation to speak of).
 *
 * @param {string} source
 * @param {number} lineStart
 * @param {number} limit
 * @returns {number | null}
 */
function measureIndent(source, lineStart, limit) {
	let index = lineStart;
	while (index < limit && (source[index] === ' ' || source[index] === '\t')) {
		index += 1;
	}
	if (index >= limit || source[index] === '\n' || source[index] === '\r') {
		return null;
	}
	return index - lineStart;
}

/**
 * Removes the indentation shared by every line of a JSX block's children. Only
 * the common part goes, so the structure inside the block is preserved.
 *
 * Lines already claimed by an edit collected inside this block are ignored:
 * their source is either replaced by generated Markdown or dropped, so their
 * indentation says nothing about the text that will remain.
 *
 * @param {CleanupContext} ctx
 * @param {number} from
 * @param {number} to
 * @param {number} nestedFrom
 */
function collectDedentEdits(ctx, from, to, nestedFrom) {
	const nested = ctx.edits.slice(nestedFrom);
	const isClaimed = (/** @type {number} */ offset) =>
		nested.some((/** @type {Edit} */ edit) => offset >= edit.start && offset < edit.end);
	/** @type {number[]} */
	const lineStarts = [];
	let common = Number.MAX_SAFE_INTEGER;
	let newline = ctx.source.indexOf('\n', from);
	while (newline !== -1 && newline + 1 < to) {
		const lineStart = newline + 1;
		const indent = measureIndent(ctx.source, lineStart, to);
		if (indent !== null && !isClaimed(lineStart)) {
			lineStarts.push(lineStart);
			common = Math.min(common, indent);
		}
		newline = ctx.source.indexOf('\n', lineStart);
	}
	if (common === 0 || common === Number.MAX_SAFE_INTEGER) {
		return;
	}
	for (const lineStart of lineStarts) {
		ctx.edits.push({ start: lineStart, end: lineStart + common });
	}
}

/**
 * Edits are applied left to right; where two start together the widest wins, so
 * a component's replacement swallows the edits collected inside it.
 *
 * @param {string} source
 * @param {Edit[]} edits
 * @returns {string}
 */
function applyEdits(source, edits) {
	const sorted = edits.slice().sort((/** @type {Edit} */ a, /** @type {Edit} */ b) => a.start - b.start || b.end - a.end);
	let result = '';
	let cursor = 0;
	for (const edit of sorted) {
		if (edit.start < cursor) {
			continue;
		}
		result += source.slice(cursor, edit.start) + (edit.text ?? '');
		cursor = edit.end;
	}
	return result + source.slice(cursor);
}

/**
 * @param {string} content
 * @returns {MdastNode}
 */
function parseMdx(content) {
	return /** @type {any} */ (fromMarkdown(content, {
		extensions: [mdxjs()],
		mdastExtensions: [mdxFromMarkdown()],
	}));
}

// ---------------------------------------------------------------------------
// Link rewriting
//
// A page read on its own has no site around it, so every link has to become an
// absolute URL: a link to another exported page points at that page's Markdown,
// everything else (the API reference, other versions, images) at the site.
// ---------------------------------------------------------------------------

/**
 * @typedef {object} LinkContext
 * @property {string} sourceDir Folder of the page source, e.g. `versioned_docs/version-5.2/plugins`.
 * @property {string} contentRoot Root the version's pages are addressed from, e.g. `versioned_docs/version-5.2`.
 * @property {string} routeDir Folder of the page's own route, e.g. `tutorials/react`.
 * @property {Map<string, string>} permalinkBySourceKey Every doc, including the API pages, by source path.
 * @property {Map<string, string>} permalinkByRoute Every documentation route, used to tell a link to a real page from one that has moved away.
 * @property {Set<string>} exported Permalinks of the pages that have a `.md`.
 * @property {string} baseUrl
 * @property {string} docsRootUrl
 * @property {(message: string) => void} warn
 */

/**
 * @param {string} dir
 * @returns {string[]}
 */
function ancestorDirectories(dir) {
	const directories = [];
	let current = dir;
	while (current !== '.' && current !== '/' && current.length > 0) {
		directories.push(current);
		current = posix.dirname(current);
	}
	return directories;
}

/**
 * Resolves a link written as a file path against the page's source folder — the
 * way Docusaurus itself resolves them — and returns the target's permalink.
 * Most links are written with an extension (`../a/b.md`), but a few omit it or
 * point at the folder of a landing page, so both forms are looked up.
 *
 * @param {string} pathPart
 * @param {string[]} bases
 * @param {LinkContext} ctx
 * @returns {string | undefined}
 */
function resolveSourcePath(pathPart, bases, ctx) {
	for (const base of bases) {
		const key = posix
			.normalize(posix.join(base, pathPart))
			.replace(/\.mdx?$/, '')
			.replace(/\/+$/, '');
		const permalink = ctx.permalinkBySourceKey.get(key) ?? ctx.permalinkBySourceKey.get(`${key}/${posix.basename(key)}`);
		if (permalink !== undefined) {
			return permalink;
		}
	}
	return undefined;
}

/**
 * @param {string} route
 * @param {LinkContext} ctx
 * @returns {string | undefined}
 */
function resolveRoute(route, ctx) {
	const normalized = posix.normalize(route).replace(/^\/+/, '').replace(/\/+$/, '');
	return ctx.permalinkByRoute.get(normalized);
}

/**
 * @param {string} permalink
 * @param {string} hash
 * @param {LinkContext} ctx
 * @returns {string}
 */
function toDocumentationUrl(permalink, hash, ctx) {
	const route = toRoute(permalink, ctx.baseUrl);
	// Only an exported page gets a `.md`; the API reference and the versions we
	// do not export are linked as the pages they are.
	return ctx.exported.has(permalink)
		? `${ctx.docsRootUrl}/${route}.md${hash}`
		: `${ctx.docsRootUrl}/${route}${hash}`;
}

/**
 * Rewrites a single link target to an absolute URL, or returns null to leave it
 * unchanged (external links, anchors, mail addresses).
 *
 * @param {string} target
 * @param {LinkContext} ctx
 * @returns {string | null}
 */
function rewriteTarget(target, ctx) {
	if (/^(mailto:|tel:|#)/.test(target)) {
		return null;
	}
	if (/^https?:/i.test(target)) {
		// A link written as a full URL to this very site still has to become a
		// Markdown link when it points at an exported page.
		if (!target.startsWith(`${ctx.docsRootUrl}/`)) {
			return null;
		}
		target = target.slice(ctx.docsRootUrl.length);
	}
	const hashIndex = target.indexOf('#');
	const pathPart = hashIndex === -1 ? target : target.slice(0, hashIndex);
	const hash = hashIndex === -1 ? '' : target.slice(hashIndex);
	if (pathPart.length === 0) {
		return null;
	}

	const permalink = pathPart.startsWith('/') ? resolveSitePath(pathPart, ctx) : resolveRelativePath(pathPart, ctx);
	if (permalink !== undefined) {
		return toDocumentationUrl(permalink, hash, ctx);
	}
	if (pathPart.startsWith('/')) {
		// Images, downloadable files: not documentation pages, but still site
		// paths that have to survive being read on their own.
		return `${ctx.docsRootUrl}/${toSiteRoute(pathPart, ctx)}${hash}`;
	}
	ctx.warn(`could not resolve the link target ${target}; it is left as it was written`);
	return null;
}

/**
 * @param {string} pathPart
 * @param {LinkContext} ctx
 * @returns {string}
 */
function toSiteRoute(pathPart, ctx) {
	return pathPart.replace(new RegExp(`^${ctx.baseUrl}`), '/').replace(/^\/+/, '').replace(/\/+$/, '');
}

/**
 * @param {string} pathPart
 * @param {LinkContext} ctx
 * @returns {string | undefined}
 */
function resolveSitePath(pathPart, ctx) {
	// Inside a version, a path is written from that version's own root:
	// `/api/interfaces/IChartApi.md` is a file, not a site route.
	const bySource = /\.mdx?$/.test(pathPart) ? resolveSourcePath(pathPart.slice(1), [ctx.contentRoot], ctx) : undefined;
	return bySource ?? resolveRoute(toSiteRoute(pathPart, ctx), ctx);
}

/**
 * A relative link is either a path to another page's source file, or a route
 * relative to the current page's URL (`./advanced`, where the file is named
 * `02-advanced.mdx`). Both readings are tried, the file one first.
 *
 * @param {string} pathPart
 * @param {LinkContext} ctx
 * @returns {string | undefined}
 */
function resolveRelativePath(pathPart, ctx) {
	const bases = pathPart.startsWith('.') ? [ctx.sourceDir] : ancestorDirectories(ctx.sourceDir);
	return resolveSourcePath(pathPart, bases, ctx) ?? resolveRoute(posix.join(ctx.routeDir, pathPart.replace(/\.mdx?$/, '')), ctx);
}

/**
 * Images are rewritten alongside links: `![x](/img/y.png)` is just as unusable
 * as a bare route once the Markdown is read outside the site.
 *
 * @param {string} body
 * @param {LinkContext} ctx
 * @returns {string}
 */
function rewriteInlineLinks(body, ctx) {
	return body.replace(
		/(!?)\[([^\]]+)\]\(([^)\s]+)(\s+"[^"]*")?\)/g,
		(/** @type {string} */ match, /** @type {string} */ bang, /** @type {string} */ text, /** @type {string} */ url, /** @type {string | undefined} */ title) => {
			const rewritten = rewriteTarget(url, ctx);
			return rewritten === null ? match : `${bang}[${text}](${rewritten}${title ?? ''})`;
		}
	);
}

/**
 * Reference-style link definitions (`[label]: url`) are line-structural, and
 * their labels frequently contain inline code. This runs with fenced-only
 * protection so an inline-code span in the label is not treated as code and does
 * not split the label from its URL.
 *
 * @param {string} body
 * @param {LinkContext} ctx
 * @returns {string}
 */
function rewriteReferenceDefinitions(body, ctx) {
	return body.replace(
		/^(\[[^\]]+\]:\s+)(\S+)/gm,
		(/** @type {string} */ match, /** @type {string} */ prefix, /** @type {string} */ url) => {
			const rewritten = rewriteTarget(url, ctx);
			return rewritten === null ? match : `${prefix}${rewritten}`;
		}
	);
}

// ---------------------------------------------------------------------------
// Page cleaning
// ---------------------------------------------------------------------------

/**
 * Everything about the page being cleaned that the MDX component renderers and
 * the link rewriter need.
 *
 * @typedef {object} PageContext
 * @property {string} source
 * @property {string} contentRoot
 * @property {string} permalink
 * @property {string} siteDir
 * @property {string} baseUrl
 * @property {string} docsRootUrl
 * @property {Map<string, string>} permalinkBySourceKey
 * @property {Map<string, string>} permalinkByRoute
 * @property {Set<string>} exported
 * @property {(path: string) => string | undefined} emittedAssetUrl
 * @property {(path: string) => string | undefined} repositoryFileUrl
 * @property {Set<string>} linkedAssets
 * @property {(message: string) => void} warn
 */

// A partial can pull in another partial; the limit only guards against a cycle.
const MAX_PARTIAL_DEPTH = 3;

/**
 * Content partials (`import Warning from './_warning.mdx'`) are pages in their
 * own right, so they go through the same cleaning before being inlined.
 *
 * @param {string} path
 * @param {PageContext} page
 * @param {number} depth
 * @returns {string}
 */
function renderPartial(path, page, depth) {
	if (depth >= MAX_PARTIAL_DEPTH) {
		page.warn(`partials nested deeper than ${MAX_PARTIAL_DEPTH} levels: ${path}`);
		return '';
	}
	try {
		const raw = readFileSync(path, 'utf-8');
		/** @type {PageContext} */
		const partialPage = { ...page, source: `@site/${relativePath(page.siteDir, path)}` };
		return cleanBody(raw, partialPage, depth + 1).body;
	} catch (error) {
		page.warn(`could not read partial ${path}: ${/** @type {Error} */ (error).message}`);
		return '';
	}
}

/**
 * @param {MdastNode} tree
 * @param {PageContext} page
 * @param {Heading[]} headings
 * @param {number} depth
 * @returns {MdxComponentContext}
 */
function createComponentContext(tree, page, headings, depth) {
	return {
		pageDir: pageDirectory(page.source, page.siteDir),
		siteDir: page.siteDir,
		docsRootUrl: page.docsRootUrl,
		bindings: collectBindings(tree),
		emittedAssetUrl: page.emittedAssetUrl,
		repositoryFileUrl: page.repositoryFileUrl,
		linkedAssets: page.linkedAssets,
		textOf: nodeText,
		addHeading: (headingDepth, text) => {
			if (headingDepth >= 2 && headingDepth <= 4) {
				headings.push({ depth: headingDepth, text });
			}
		},
		renderPartial: path => renderPartial(path, page, depth),
		warn: page.warn,
	};
}

/**
 * @param {string} raw
 * @param {PageContext} page
 * @param {number} depth
 * @returns {{ body: string, headings: Heading[] }}
 */
function cleanBody(raw, page, depth) {
	// HTML comments and `{#anchor}` heading IDs are not valid MDX expressions and
	// would break parsing. Strip them outside fenced code (which may legitimately
	// show them, e.g. an HTML example) before parsing.
	const content = transformOutsideFences(stripFrontmatter(raw), segment =>
		segment
			.replace(/<!--[\s\S]*?-->/g, '')
			// Only the spaces around the anchor: `\s` would eat the blank line
			// after the heading and pull the next block onto its line.
			.replace(/^(#{1,6}[^\n]*?)[ \t]*\{#[-\w]+\}[ \t]*$/gm, '$1')
	);
	/** @type {Heading[]} */
	const headings = [];
	let body;
	try {
		const tree = parseMdx(content);
		/** @type {CleanupContext} */
		const cleanup = {
			source: content,
			edits: [],
			headings,
			components: createComponentContext(tree, page, headings, depth),
		};
		collectCleanup(tree, cleanup);
		body = applyEdits(content, cleanup.edits);
	} catch (error) {
		// Parsing succeeds for all current pages; fall back defensively so a
		// single unusual page can never break the build.
		page.warn(`MDX parse failed, using the raw source: ${/** @type {Error} */ (error).message}`);
		body = content;
	}

	/** @type {LinkContext} */
	const ctx = {
		sourceDir: posix.dirname(sourceKey(page.source)),
		contentRoot: page.contentRoot,
		routeDir: posix.dirname(toRoute(page.permalink, page.baseUrl)),
		permalinkBySourceKey: page.permalinkBySourceKey,
		permalinkByRoute: page.permalinkByRoute,
		exported: page.exported,
		baseUrl: page.baseUrl,
		docsRootUrl: page.docsRootUrl,
		warn: page.warn,
	};
	body = transformOutsideFences(
		body,
		segment => {
			const linked = rewriteInlineLinks(rewriteReferenceDefinitions(segment, ctx), ctx);
			// Collapse blank-line runs left behind by removed components.
			return linked.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n');
		},
		// A fenced block written directly on the page carries the same styling
		// comments as the samples passed to `<CodeBlock>`, and they are just as
		// meaningless once the code is read as text.
		block => cleanCodeSample(block, false)
	);
	return { body: body.trim(), headings };
}

/**
 * @param {string} body
 * @param {string} title
 * @returns {string}
 */
function withTitle(body, title) {
	// Most pages carry their own `# Title`; only add one where the page relies
	// on the front matter for it.
	return /^#\s/.test(body) ? `${body}\n` : `# ${title}\n\n${body}\n`;
}

/**
 * Footer appended to every per-page Markdown file so an assistant that reads a
 * single page can discover the rest of the docs — and knows which version of
 * the library it is holding. The page's own URL cannot say: the released
 * version is served from the unversioned path, and the API changed enough
 * between v4 and v5 that a page taken for the wrong one is worse than no page.
 *
 * @param {string} docsRootUrl
 * @param {string | null} version
 * @returns {string}
 */
function sitemapFooter(docsRootUrl, version) {
	return [
		'',
		'---',
		'',
		...(version === null ? [] : [`Documentation for Lightweight Charts™ v${version} (latest released version).`, '']),
		'## Sitemap',
		'',
		`- [All documentation pages](${docsRootUrl}/llms.txt)`,
		`- [Full page map with headings](${docsRootUrl}/docs_map.md)`,
		'',
	].join('\n');
}

// Files webpack publishes under a content-hashed name — the runnable example
// pages the tutorials embed. Nothing in the build records which source each one
// came from, but the copies are byte-for-byte identical, so they are indexed by
// the digest of their content and looked up the same way.
const EMITTED_ASSET_NAME = /^[0-9a-f]{16,}\.[a-z0-9]+$/i;

/**
 * @param {Buffer | string} content
 * @returns {string}
 */
function digestOf(content) {
	return createHash('md5').update(content).digest('hex');
}

/**
 * @param {string} outDir
 * @param {string} docsRootUrl
 * @returns {Promise<Map<string, string>>}
 */
async function readEmittedAssets(outDir, docsRootUrl) {
	/** @type {Map<string, string>} */
	const assets = new Map();
	let entries;
	try {
		entries = await readdir(outDir, { withFileTypes: true });
	} catch {
		return assets;
	}
	for (const entry of entries) {
		if (!entry.isFile() || !EMITTED_ASSET_NAME.test(entry.name)) {
			continue;
		}
		try {
			assets.set(digestOf(await readFile(join(outDir, entry.name))), `${docsRootUrl}/${entry.name}`);
		} catch {
			continue;
		}
	}
	return assets;
}

/**
 * @param {string} source
 * @param {string} siteDir
 * @returns {Promise<string>}
 */
function readSource(source, siteDir) {
	return readFile(join(siteDir, source.replace(/^@site[\\/]?/, '')), 'utf-8');
}

// ---------------------------------------------------------------------------
// Rendering of docs_map.md / llms.txt
// ---------------------------------------------------------------------------

/**
 * @typedef {{ heading: string, nodes: DocsNode[] }} MappedSection A section as the map and the index file list it.
 * @typedef {MappedSection & { version: string | null }} RenderedSection A section as the plugin holds it, with the release its pages document.
 */

/**
 * @param {DocNode} node
 * @param {string} baseUrl
 * @param {string} docsRootUrl
 * @param {Heading[] | undefined} headings
 * @returns {string[]}
 */
function renderDocLines(node, baseUrl, docsRootUrl, headings) {
	const lines = [`- [${node.title}](${docsRootUrl}/${toRoute(node.permalink, baseUrl)}.md)`];
	for (const heading of headings ?? []) {
		lines.push(`${'  '.repeat(heading.depth - 1)}- ${heading.text}`);
	}
	return lines;
}

/**
 * @param {DocsNode[]} nodes
 * @param {string} baseUrl
 * @param {string} docsRootUrl
 * @param {Map<string, Heading[]> | null} headingsByPermalink
 * @param {number} level
 * @param {string[]} output
 */
function renderNodes(nodes, baseUrl, docsRootUrl, headingsByPermalink, level, output) {
	for (const node of nodes) {
		if (node.kind === 'category') {
			output.push('', `${'#'.repeat(Math.min(level, 6))} ${node.label}`, '');
			renderNodes(node.children, baseUrl, docsRootUrl, headingsByPermalink, level + 1, output);
		} else {
			output.push(...renderDocLines(node, baseUrl, docsRootUrl, headingsByPermalink?.get(node.permalink)));
		}
	}
}

/**
 * @typedef {object} IndexFileConfig
 * @property {string} title
 * @property {string} intro
 * @property {string[]} structureNote
 * @property {MappedSection[]} sections
 * @property {string} baseUrl
 * @property {string} docsRootUrl
 * @property {Map<string, Heading[]> | null} headingsByPermalink
 * @property {boolean} hasTypeDefinitions
 * @property {string | null} version
 * @property {string} generatedAt
 */

/**
 * @param {IndexFileConfig} config
 * @returns {string}
 */
function renderIndexFile(config) {
	/** @type {string[]} */
	const body = [];
	for (const section of config.sections) {
		body.push('', `## ${section.heading}`, '');
		renderNodes(section.nodes, config.baseUrl, config.docsRootUrl, config.headingsByPermalink, 3, body);
	}
	const typeDefinitions = config.hasTypeDefinitions
		? [
			'## Type Definitions',
			'',
			`- [Lightweight Charts API (TypeScript declarations)](${config.docsRootUrl}/${TYPE_DEFINITIONS_FILE})`,
			'',
		]
		: [];
	// `llms.txt` opens with a blockquote summary, and its version and timestamp
	// belong to that same quote; the map opens with a paragraph, which the two
	// lines must not run into.
	const beforeMetadata = config.intro.startsWith('>') ? [] : [''];
	return [
		`# ${config.title}`,
		'',
		config.intro,
		...beforeMetadata,
		...(config.version === null ? [] : [`> Version: ${config.version} (latest released)`]),
		`> Last updated: ${config.generatedAt}`,
		'',
		...config.structureNote,
		body.join('\n'),
		'',
		...typeDefinitions,
	].join('\n');
}

/**
 * @param {Omit<IndexFileConfig, 'title' | 'intro' | 'structureNote'>} config
 * @returns {string}
 */
function renderDocsMap(config) {
	return renderIndexFile({
		...config,
		title: 'Lightweight Charts™ - Documentation Map',
		intro: 'A map of all documentation pages with their headings, for navigation by LLMs and tools. Every page is available as Markdown at the linked URL.',
		structureNote: [
			'This map uses a hierarchical structure:',
			'',
			'* `##`/`###` mark documentation groups',
			'* `- [title](url.md)` marks a page (fetch the `.md` URL for its full content)',
			'* Nested bullets show the heading structure within each page',
		],
	});
}

/**
 * @param {Omit<IndexFileConfig, 'title' | 'intro' | 'structureNote'>} config
 * @returns {string}
 */
function renderLlmsTxt(config) {
	return renderIndexFile({
		...config,
		title: 'Lightweight Charts™',
		intro: [
			'> Official documentation for Lightweight Charts™, a free, open-source library for building interactive financial charts on the web. Every page below is available as Markdown by appending `.md` to its URL.',
			`> See [docs_map.md](${config.docsRootUrl}/docs_map.md) for a version that also lists each page's headings.`,
		].join('\n'),
		structureNote: [],
	});
}

// ---------------------------------------------------------------------------
// The plugin
// ---------------------------------------------------------------------------

/**
 * @param {import('@docusaurus/types').LoadContext} context
 * @returns {import('@docusaurus/types').Plugin}
 */
export function docsMarkdownPlugin(context) {
	const { siteDir, baseUrl } = context;
	const docsRootUrl = siteRootUrl(context.siteConfig.url, baseUrl);
	const { organizationName, projectName } = context.siteConfig;
	const repositoryUrl = `https://github.com/${organizationName}/${projectName}`;

	/** @type {RenderedSection[]} */
	let sections = [];
	// Every doc of every version and instance, so a link to a page we do not
	// export still resolves to the right URL.
	/** @type {Map<string, string>} */
	const permalinkBySourceKey = new Map();
	/** @type {Map<string, string>} */
	const permalinkByRoute = new Map();
	/** @type {string | null} */
	let releasedVersion = null;

	return {
		name: 'docs-markdown-plugin',

		/** @param {{ allContent: Record<string, Record<string, unknown>> }} args */
		allContentLoaded({ allContent }) {
			const instances = allContent[DOCS_PLUGIN_NAME];
			if (instances === undefined) {
				logger.warn('[docs-markdown-plugin] content-docs content not found; skipping.');
				return;
			}

			for (const content of Object.values(instances)) {
				for (const version of /** @type {{ loadedVersions: LoadedVersion[] }} */ (content)?.loadedVersions ?? []) {
					for (const doc of version.docs) {
						permalinkBySourceKey.set(sourceKey(doc.source), doc.permalink);
						permalinkByRoute.set(toRoute(doc.permalink, baseUrl), doc.permalink);
					}
				}
			}

			sections = [];
			for (const section of EXPORTED_SECTIONS) {
				const content = /** @type {{ loadedVersions: LoadedVersion[] } | undefined} */ (instances[section.pluginId]);
				const version = (content?.loadedVersions ?? []).find(section.pickVersion);
				if (version === undefined) {
					logger.warn(`[docs-markdown-plugin] no version to export for "${section.pluginId}"; skipping it.`);
					continue;
				}
				if (section.pluginId === 'default') {
					releasedVersion = version.versionName;
				}
				const docsById = new Map(version.docs.map((/** @type {DocMetadata} */ doc) => [doc.id, doc]));
				const nodes = hoistRootDocs(buildDocsNodes(version.sidebars[section.sidebar] ?? [], docsById, baseUrl, contentRootOf(version, siteDir)));
				if (nodes.length > 0) {
					// An instance with a single version of its own (the tutorials) is not
					// versioned, and nothing about it can be stamped with a release.
					sections.push({ heading: section.heading, nodes, version: version.versionName === 'current' ? null : version.versionName });
				}
			}
		},

		/** @param {{ outDir: string }} args */
		async postBuild({ outDir }) {
			if (sections.length === 0) {
				return;
			}

			// Each page is written with the version of the section it belongs to.
			/** @type {{ node: DocNode, version: string | null }[]} */
			const pages = [];
			for (const section of sections) {
				/** @type {DocNode[]} */
				const sectionNodes = [];
				collectDocNodes(section.nodes, sectionNodes);
				for (const node of sectionNodes) {
					pages.push({ node, version: section.version });
				}
			}
			// Pages know about each other: a link is only rewritten to a `.md` when
			// the page it points at is exported too.
			const exported = new Set(pages.map((/** @type {{ node: DocNode }} */ page) => page.node.permalink));

			const emittedAssets = await readEmittedAssets(outDir, docsRootUrl);
			const emittedAssetUrl = (/** @type {string} */ path) => {
				try {
					return emittedAssets.get(digestOf(readFileSync(path)));
				} catch {
					return undefined;
				}
			};
			const repositoryFileUrl = (/** @type {string} */ path) => {
				const relative = relativePath(siteDir, path).replace(/\\/g, '/');
				return relative.startsWith('..') ? undefined : `${repositoryUrl}/blob/${DEFAULT_BRANCH}/website/${relative}`;
			};

			/** @type {Map<string, Heading[]>} */
			const headingsByPermalink = new Map();
			/** @type {Set<string>} */
			const written = new Set();

			const writePage = async (/** @type {DocNode} */ node, /** @type {string | null} */ version) => {
				let raw;
				try {
					raw = await readSource(node.source, siteDir);
				} catch (error) {
					logger.warn(`[docs-markdown-plugin] could not read ${node.source}: ${/** @type {Error} */ (error).message}`);
					return;
				}
				const route = toRoute(node.permalink, baseUrl);
				/** @type {string[]} */
				const warnings = [];
				/** @type {PageContext} */
				const page = {
					source: node.source,
					contentRoot: node.contentRoot,
					permalink: node.permalink,
					siteDir,
					baseUrl,
					docsRootUrl,
					permalinkBySourceKey,
					permalinkByRoute,
					exported,
					emittedAssetUrl,
					repositoryFileUrl,
					// The pages an article embeds are linked once, however many
					// times the article points at them.
					linkedAssets: new Set(),
					warn: message => warnings.push(message),
				};
				const { body, headings } = cleanBody(raw, page, 0);
				for (const warning of warnings) {
					logger.warn(`[docs-markdown-plugin] ${route}: ${warning}`);
				}
				const file = join(outDir, `${route}.md`);
				try {
					await mkdir(dirname(file), { recursive: true });
					await writeFile(file, `${withTitle(body, node.title)}${sitemapFooter(docsRootUrl, version)}`, 'utf-8');
				} catch (error) {
					logger.warn(`[docs-markdown-plugin] could not write ${file}: ${/** @type {Error} */ (error).message}`);
					return;
				}
				headingsByPermalink.set(node.permalink, headings);
				written.add(node.permalink);
			};

			await Promise.all(pages.map((/** @type {{ node: DocNode, version: string | null }} */ page) => writePage(page.node, page.version)));

			const hasTypeDefinitions = await copyTypeDefinitions(siteDir, outDir, releasedVersion, docsRootUrl);

			// Build the map/index from what was actually written, so no link 404s.
			const writtenSections = sections
				.map((/** @type {RenderedSection} */ section) => ({ heading: section.heading, nodes: pruneToWritten(section.nodes, written) }))
				.filter((/** @type {MappedSection} */ section) => section.nodes.length > 0);
			const generatedAt = `${new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')} UTC`;
			const common = { sections: writtenSections, baseUrl, docsRootUrl, hasTypeDefinitions, version: releasedVersion, generatedAt };

			await writeFile(join(outDir, 'docs_map.md'), renderDocsMap({ ...common, headingsByPermalink }), 'utf-8');
			await writeFile(join(outDir, 'llms.txt'), renderLlmsTxt({ ...common, headingsByPermalink: null }), 'utf-8');

			logger.info(`[docs-markdown-plugin] wrote ${written.size} .md pages + docs_map.md + llms.txt`);
		},
	};
}

/**
 * The folder a version's pages are addressed from, relative to the site
 * (`versioned_docs/version-5.2`, `tutorials`): a link written as
 * `/api/interfaces/IChartApi.md` is a path from there, not from the site root.
 *
 * @param {LoadedVersion} version
 * @param {string} siteDir
 * @returns {string}
 */
function contentRootOf(version, siteDir) {
	return typeof version.contentPath === 'string' ? relativePath(siteDir, version.contentPath).replace(/\\/g, '/') : '.';
}

/**
 * Publishes the TypeScript declarations the API reference is generated from.
 * They are the complete API in a form a machine reader can take in at once,
 * which the per-symbol reference pages are not.
 *
 * @param {string} siteDir
 * @param {string} outDir
 * @param {string | null} version
 * @param {string} docsRootUrl
 * @returns {Promise<boolean>}
 */
async function copyTypeDefinitions(siteDir, outDir, version, docsRootUrl) {
	/** @type {{ path: string, version: string | null }[]} */
	const candidates = [];
	if (version !== null) {
		candidates.push({ path: join(siteDir, TYPINGS_CACHE_DIR, `v${version}.d.ts`), version });
	}
	candidates.push({ path: join(siteDir, '..', 'dist', 'typings.d.ts'), version: null });
	for (const candidate of candidates) {
		try {
			const declarations = await readFile(candidate.path, 'utf-8');
			await writeFile(join(outDir, TYPE_DEFINITIONS_FILE), typeDefinitionsHeader(candidate.version, docsRootUrl) + declarations, 'utf-8');
			return true;
		} catch {
			continue;
		}
	}
	logger.warn('[docs-markdown-plugin] no type definitions found; the index files will not link them.');
	return false;
}

/**
 * The declarations are generated as a bare bundle: the first thing in the file
 * is `// Generated by dts-bundle-generator`, and nothing in it says which
 * library — or which version of it — the types belong to. Read on the site,
 * away from the package that ships them, they need to introduce themselves,
 * and to say where the prose that goes with them lives.
 *
 * @param {string | null} version
 * @param {string} docsRootUrl
 * @returns {string}
 */
function typeDefinitionsHeader(version, docsRootUrl) {
	return [
		'/**',
		` * TradingView Lightweight Charts™${version === null ? '' : ` v${version}`}`,
		' * TypeScript declarations for the `lightweight-charts` package.',
		` * Documentation: ${docsRootUrl}`,
		' */',
		'',
	].join('\n');
}
