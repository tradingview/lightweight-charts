// @ts-check

import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';

import { themeColors } from '../../theme-colors.js';

// ---------------------------------------------------------------------------
// Markdown for the content our MDX components render.
//
// The per-page Markdown export cleans the page *source*, so anything a React
// component draws (code blocks fed from a variable, navigation cards, tabs)
// never reaches the .md file. Instead of converting the built HTML back to
// Markdown, we rebuild that content from the component's own inputs:
// `mdast-util-mdx` hands us a parsed ESTree for every prop and for every
// `{expression}` child, so a `<CodeBlock>{example}</CodeBlock>` can be resolved
// back to the string the page assembles it from.
// ---------------------------------------------------------------------------

/**
 * Minimal mdast/MDX node shape, covering the fields the cleaner and the
 * renderers read. Offsets are always present because from-markdown emits
 * positions by default.
 *
 * @typedef {object} MdastNode
 * @property {string} type
 * @property {string | null} [name]
 * @property {number} [depth]
 * @property {string} [value]
 * @property {MdastNode[]} [children]
 * @property {any[]} [attributes]
 * @property {{ estree?: any }} [data]
 * @property {{ start: { offset?: number }, end: { offset?: number } }} [position]
 */

/**
 * What a name declared on the page refers to: the module it is imported from,
 * or the expression the const it names is assigned.
 *
 * @typedef {{ module?: string, expression?: any }} Binding
 */

/**
 * Everything a renderer needs from the page being processed.
 *
 * @typedef {object} MdxComponentContext
 * @property {string} pageDir Absolute directory of the page source, used to resolve its imports.
 * @property {string} siteDir Absolute path the `@site` import alias points at.
 * @property {Map<string, Binding>} bindings Local name -> import/const declared on the page.
 * @property {string} docsRootUrl
 * @property {(path: string) => string | undefined} emittedAssetUrl URL of the build's copy of a file the page embeds.
 * @property {(path: string) => string | undefined} repositoryFileUrl URL of a file of the site as it sits in the repository.
 * @property {Set<string>} linkedAssets Assets already linked from this page, so an embed and the link next to it do not both appear.
 * @property {(node: MdastNode) => string} textOf
 * @property {(depth: number, text: string) => void} addHeading
 * @property {(path: string) => string} renderPartial Cleans an imported .mdx/.md partial and returns its Markdown.
 * @property {(message: string) => void} warn
 */

/**
 * How a component contributes to the page. `text` replaces the whole element
 * and drops its children; `before`/`after` replace the tags and keep them.
 *
 * @typedef {{ text?: string, before?: string, after?: string }} ComponentReplacement
 */

// ---------------------------------------------------------------------------
// Static evaluation of component props and `{expression}` children
// ---------------------------------------------------------------------------

// Calls whose argument is the value we want: `useBaseUrl('/img/x.svg')` is a
// site-absolute path, `require('!!raw-loader!./x.js')` a module we resolve like
// an import.
const PASSTHROUGH_CALLS = new Set(['useBaseUrl', 'require']);

/**
 * @param {any} node
 * @param {MdxComponentContext} ctx
 * @returns {any}
 */
function evaluateTemplate(node, ctx) {
	// A template with substitutions is assembled at runtime; only the literal
	// ones are content we can reproduce.
	if (node.expressions.length > 0) {
		return undefined;
	}
	return node.quasis.map((/** @type {any} */ quasi) => quasi.value.cooked ?? '').join('');
}

/**
 * @param {any} node
 * @param {MdxComponentContext} ctx
 * @returns {any[]}
 */
function evaluateArray(node, ctx) {
	const values = [];
	for (const element of node.elements) {
		const value = evaluateExpression(element, ctx);
		if (value !== undefined) {
			values.push(value);
		}
	}
	return values;
}

/**
 * @param {any} node
 * @param {MdxComponentContext} ctx
 * @returns {Record<string, any>}
 */
function evaluateObject(node, ctx) {
	/** @type {Record<string, any>} */
	const result = {};
	for (const property of node.properties) {
		if (property.type !== 'Property' || property.computed === true) {
			continue;
		}
		const key = propertyKey(property.key);
		const value = evaluateExpression(property.value, ctx);
		if (key !== undefined && value !== undefined) {
			result[key] = value;
		}
	}
	return result;
}

/**
 * `require('./x.html').default`: the interop wrapper around an asset import,
 * where the value we want is the module itself.
 *
 * @param {any} node
 * @param {MdxComponentContext} ctx
 * @returns {any}
 */
function evaluateMember(node, ctx) {
	if (node.computed === true || node.property?.type !== 'Identifier' || node.property.name !== 'default') {
		return undefined;
	}
	return evaluateExpression(node.object, ctx);
}

/**
 * @param {any} node
 * @param {MdxComponentContext} ctx
 * @returns {any}
 */
function evaluateCall(node, ctx) {
	if (node.callee?.type !== 'Identifier' || !PASSTHROUGH_CALLS.has(node.callee.name)) {
		return undefined;
	}
	const argument = (node.arguments ?? [])[0];
	if (node.callee.name === 'require' && argument?.type === 'Literal' && typeof argument.value === 'string') {
		return resolveModule(argument.value, ctx);
	}
	return evaluateExpression(argument, ctx);
}

/** @type {Record<string, (node: any, ctx: MdxComponentContext) => any>} */
const EXPRESSION_EVALUATORS = {
	Literal: node => (node.value === undefined ? undefined : node.value),
	TemplateLiteral: evaluateTemplate,
	ArrayExpression: evaluateArray,
	ObjectExpression: evaluateObject,
	Identifier: (node, ctx) => resolveBinding(node.name, ctx),
	MemberExpression: evaluateMember,
	CallExpression: evaluateCall,
};

/**
 * Evaluates the literal parts of an expression. Anything dynamic (JSX icons,
 * CSS-module lookups, function calls we don't know) yields `undefined` and is
 * simply left out of the rendered Markdown.
 *
 * @param {any} node
 * @param {MdxComponentContext} ctx
 * @returns {any}
 */
function evaluateExpression(node, ctx) {
	const evaluate = node === undefined || node === null ? undefined : EXPRESSION_EVALUATORS[node.type];
	return evaluate === undefined ? undefined : evaluate(node, ctx);
}

/**
 * @param {any} key
 * @returns {string | undefined}
 */
function propertyKey(key) {
	if (key?.type === 'Identifier') {
		return key.name;
	}
	if (key?.type === 'Literal') {
		return typeof key.value === 'string' ? key.value : undefined;
	}
	return undefined;
}

/**
 * A name used as a prop (or as a `{child}`) is either a const declared on the
 * page — `export const example = \`…\`` — or an import of content that sits next
 * to it, so both are resolved to the value they stand for.
 *
 * @param {string} name
 * @param {MdxComponentContext} ctx
 * @returns {any}
 */
function resolveBinding(name, ctx) {
	const binding = ctx.bindings.get(name);
	if (binding === undefined) {
		return undefined;
	}
	if (binding.module === undefined) {
		return evaluateExpression(binding.expression, ctx);
	}
	return resolveModule(binding.module, ctx);
}

// Webpack inline-loader syntax: `!!raw-loader!./x.js` imports the file as text,
// `!!file-loader!./x.html` as an emitted URL. Only the path after the loaders
// identifies the file.
const INLINE_LOADER = /^!!?([\w-]+!)+/;

/**
 * Reads the content a module specifier stands for: the text of a raw-loaded
 * file, or a parsed JSON table. Anything else (a real JS module, a stylesheet)
 * has no content we can put in Markdown.
 *
 * @param {string} specifier
 * @param {MdxComponentContext} ctx
 * @returns {any}
 */
function resolveModule(specifier, ctx) {
	const path = specifier.replace(INLINE_LOADER, '');
	const isRawText = /^!!?raw-loader!/.test(specifier);
	// `!!file-loader!./demo.html` publishes the file and hands the page its URL,
	// so what the import stands for is the file itself, not its text.
	if (INLINE_LOADER.test(specifier) && !isRawText) {
		return { asset: resolveSpecifier(path, ctx) };
	}
	if (!isRawText && !path.endsWith('.json')) {
		return undefined;
	}
	const content = readFirstExisting(resolveSpecifier(path, ctx));
	if (content === undefined) {
		ctx.warn(`could not read ${specifier}`);
		return undefined;
	}
	if (isRawText) {
		return content;
	}
	try {
		return JSON.parse(content);
	} catch (error) {
		ctx.warn(`could not parse ${specifier}: ${/** @type {Error} */ (error).message}`);
		return undefined;
	}
}

// An import can leave the extension to the bundler
// (`!!raw-loader!@site/src/components/x`), so the file is looked for the way
// webpack would resolve it.
const IMPLIED_EXTENSIONS = ['', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.json'];

/**
 * @param {string} path
 * @returns {string | undefined}
 */
function readFirstExisting(path) {
	for (const extension of IMPLIED_EXTENSIONS) {
		try {
			return readFileSync(`${path}${extension}`, 'utf-8');
		} catch {
			continue;
		}
	}
	return undefined;
}

/**
 * Resolves a module specifier used by a page to an absolute path. Only the
 * relative form and the `@site` alias can point at content we own.
 *
 * @param {string} specifier
 * @param {MdxComponentContext} ctx
 * @returns {string}
 */
function resolveSpecifier(specifier, ctx) {
	if (specifier.startsWith('@site/')) {
		return join(ctx.siteDir, specifier.slice('@site/'.length));
	}
	return isAbsolute(specifier) ? specifier : join(ctx.pageDir, specifier);
}

/**
 * @param {MdastNode} node
 * @param {MdxComponentContext} ctx
 * @returns {Record<string, any>}
 */
function readProps(node, ctx) {
	/** @type {Record<string, any>} */
	const props = {};
	for (const attribute of node.attributes ?? []) {
		if (attribute.type !== 'mdxJsxAttribute' || attribute.name === undefined) {
			continue;
		}
		const value = attribute.value;
		if (value === null || value === undefined) {
			props[attribute.name] = true; // boolean shorthand, e.g. `chart`
		} else if (typeof value === 'string') {
			props[attribute.name] = value;
		} else {
			props[attribute.name] = evaluateExpression(value.data?.estree?.body[0]?.expression, ctx);
		}
	}
	return props;
}

/**
 * @param {any} value
 * @returns {string | undefined}
 */
function asString(value) {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

// ---------------------------------------------------------------------------
// Code blocks
// ---------------------------------------------------------------------------

// Comments the site uses to style a code sample (see the `magicComments`
// configuration and the enhanced-codeblock plugin). They mark up the rendered
// block and are not part of the sample itself. The lines they mark stay: the
// highlighted ones are shown as they are, and the hidden ones are one click
// away behind the "Show all code" toggle.
const MAGIC_COMMENT_NAMES = [
	'highlight-next-line', 'highlight-start', 'highlight-end',
	'highlight-fade-start', 'highlight-fade-end', 'highlight-fade',
	'hide-start', 'hide-end', 'hide-line',
];

const MAGIC_COMMENT_PATTERN = `(?:\\/\\/|\\/\\*|<!--|#)[ \\t]*(?:${MAGIC_COMMENT_NAMES.join('|')})[ \\t]*(?:\\*\\/|-->)?`;

// `delete-start` … `delete-end` marks code the site strips before showing the
// block (see `removeUnwantedLines`), so it never reaches a reader.
const DELETED_SECTION = /^[^\n]*\bdelete-start\b[\s\S]*?\bdelete-end\b[^\n]*\n?/gm;

// `remove-*` marks the sample's scaffolding — the file's title comment, a type
// annotation the live example needs. Unlike `hide-*`, the site has no way to
// reveal it (`.code-block-remove-line` is `display: none` with no counterpart
// to the toggle), so it is not part of the sample a reader ever sees.
const MARKER_ONLY = (/** @type {string} */ name) =>
	new RegExp(`^[ \\t]*(?:\\/\\/|\\/\\*|<!--|#)[ \\t]*${name}[ \\t]*(?:\\*\\/|-->)?[ \\t]*$`);
const REMOVE_START = MARKER_ONLY('remove-start');
const REMOVE_END = MARKER_ONLY('remove-end');
const REMOVE_LINE = MARKER_ONLY('remove-line');
const TRAILING_REMOVE_LINE = /(?:\/\/|\/\*|<!--|#)[ \t]*remove-line\b/;

/**
 * Drops the lines the site removes from a sample. A marker on a line of its own
 * takes the line that follows it — the line it marks — with it; one at the end
 * of a line of code takes that line, the way the magic comments are read.
 *
 * @param {string} code
 * @returns {string}
 */
function dropRemovedLines(code) {
	const lines = code.split('\n');
	/** @type {string[]} */
	const kept = [];
	let inRemovedSection = false;
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (REMOVE_START.test(line)) {
			inRemovedSection = true;
		} else if (REMOVE_END.test(line)) {
			inRemovedSection = false;
		} else if (inRemovedSection) {
			continue;
		} else if (REMOVE_LINE.test(line)) {
			index += 1;
		} else if (!TRAILING_REMOVE_LINE.test(line)) {
			kept.push(line);
		}
	}
	return kept.join('\n');
}

/** @type {Record<string, string>} */
const LIGHT_THEME_COLORS = themeColors.LIGHT;
const THEME_COLOR_NAMES = Object.keys(LIGHT_THEME_COLORS);

/**
 * Cleans a code sample the way the site does before showing it: drops the
 * sections marked as deleted and the lines marked as removed, strips the magic
 * comments that only style the rendered block, and — for the samples rendered
 * next to a live chart — substitutes the colour constants with their values.
 *
 * @param {string} code
 * @param {boolean} replaceThemeConstants
 * @returns {string}
 */
export function cleanCodeSample(code, replaceThemeConstants) {
	let result = code.replace(DELETED_SECTION, '');
	if (replaceThemeConstants) {
		// The light palette stands in for both themes, the same way a themed
		// image is exported in its light variant only.
		for (const name of THEME_COLOR_NAMES) {
			// Bounded, so a longer identifier that merely contains a colour name
			// (`CHART_BACKGROUND_RGB_COLOR`) is not rewritten from the inside out.
			result = result.replace(new RegExp(`\\b${name}\\b`, 'g'), `'${LIGHT_THEME_COLORS[name]}'`);
		}
	}
	const markerOnly = new RegExp(`^[ \\t]*${MAGIC_COMMENT_PATTERN}[ \\t]*$`);
	const marker = new RegExp(MAGIC_COMMENT_PATTERN, 'g');
	return dropRemovedLines(result)
		.split('\n')
		// A marker on a line of its own goes with the line, so the sample keeps
		// its shape; one at the end of a line of code goes on its own.
		.filter((/** @type {string} */ line) => !markerOnly.test(line))
		.map((/** @type {string} */ line) => line.replace(marker, '').replace(/[ \t]+$/, ''))
		.join('\n');
}

// A fence long enough to hold the sample, so a code block that itself contains
// a fenced block (the HTML samples embed Markdown-free code, but a Vue file can
// contain anything) is not cut short.
/**
 * @param {string} code
 * @returns {string}
 */
function fenceFor(code) {
	const longest = (code.match(/^[ \t]*(`{3,})/gm) ?? []).reduce(
		(/** @type {number} */ max, /** @type {string} */ match) => Math.max(max, match.trim().length),
		0
	);
	return '`'.repeat(Math.max(3, longest + 1));
}

/**
 * `<CodeBlock className="language-js">{example}</CodeBlock>` — the sample lives
 * in a const or an imported file, so the tag is replaced by a fenced block
 * holding the code it displays.
 *
 * @param {Record<string, any>} props
 * @param {MdastNode} node
 * @param {MdxComponentContext} ctx
 * @returns {ComponentReplacement | null}
 */
function renderCodeBlock(props, node, ctx) {
	const code = codeOf(node, ctx);
	if (code === undefined) {
		ctx.warn('CodeBlock: could not resolve the code it shows');
		return null;
	}
	const language = languageOf(props);
	const cleaned = cleanCodeSample(code, props.replaceThemeConstants === true).trim();
	const fence = fenceFor(cleaned);
	// A `chartOnly` block is shown on the page as a live chart with its code
	// hidden. The chart cannot survive the export, so its code stands in for it,
	// introduced for what it is — the page's own text promises a picture.
	const lead = props.chartOnly === true ? '_Source of the interactive example shown on this page:_\n\n' : '';
	return { text: `\n\n${lead}${fence}${language}\n${cleaned}\n${fence}\n\n` };
}

/**
 * @param {MdastNode} node
 * @param {MdxComponentContext} ctx
 * @returns {string | undefined}
 */
function codeOf(node, ctx) {
	for (const child of node.children ?? []) {
		if (child.type === 'mdxFlowExpression' || child.type === 'mdxTextExpression') {
			const value = evaluateExpression(child.data?.estree?.body[0]?.expression, ctx);
			if (typeof value === 'string') {
				return value;
			}
		}
	}
	// A block written with its code inline (rather than passed as a value).
	const text = ctx.textOf(node);
	return text.trim().length > 0 ? text : undefined;
}

/**
 * @param {Record<string, any>} props
 * @returns {string}
 */
function languageOf(props) {
	const className = asString(props.className) ?? '';
	const match = /language-([\w-]+)/.exec(className);
	return match === null ? '' : match[1];
}

// ---------------------------------------------------------------------------
// Component renderers
// ---------------------------------------------------------------------------

/**
 * @param {Record<string, any>} props
 * @param {MdxComponentContext} ctx
 * @returns {ComponentReplacement | null}
 */
function renderCardLinkList(props, ctx) {
	const items = props.items;
	if (!Array.isArray(items)) {
		ctx.warn('CardLinkList: could not resolve its items');
		return null;
	}
	const lines = [];
	for (const item of items) {
		if (item === null || typeof item !== 'object' || Array.isArray(item)) {
			continue;
		}
		const href = asString(item.href);
		const title = asString(item.title);
		if (href === undefined || title === undefined) {
			continue;
		}
		const description = asString(item.description);
		lines.push(`- [${title}](${href})${description === undefined ? '' : ` - ${description}`}`);
	}
	if (lines.length === 0) {
		ctx.warn('CardLinkList: none of its items could be resolved');
		return null;
	}
	return { text: `\n\n${lines.join('\n')}\n\n` };
}

/**
 * Images are occasionally written as JSX, which the source cleaning would drop
 * along with the tag.
 *
 * @param {Record<string, any>} props
 * @param {MdxComponentContext} ctx
 * @returns {ComponentReplacement | null}
 */
function renderImage(props, ctx) {
	const src = asString(props.src);
	if (src === undefined) {
		return null;
	}
	return { text: `\n\n![${asString(props.alt) ?? ''}](${absoluteUrl(src, ctx)})\n\n` };
}

/**
 * The tutorials show each step as a runnable page inside an iframe. That page is
 * published with the site, so the embed becomes a link to it — the one thing a
 * reader of the Markdown can still follow.
 *
 * @param {Record<string, any>} props
 * @param {MdxComponentContext} ctx
 * @returns {ComponentReplacement | null}
 */
function renderIframe(props, ctx) {
	const url = embeddedUrl(props.src, ctx);
	if (url === undefined) {
		return { text: '' };
	}
	ctx.linkedAssets.add(url);
	return { text: `\n\n[${asString(props.title) ?? 'Interactive example'}](${url})\n\n` };
}

/**
 * A link written as JSX keeps its target only if that target resolves. The
 * "View in a new window" link next to an embedded example points at the very
 * page the embed above it already links to, and its label says nothing on its
 * own, so it goes rather than repeating the link.
 *
 * @param {Record<string, any>} props
 * @param {MdxComponentContext} ctx
 * @returns {ComponentReplacement | null}
 */
function renderAnchor(props, ctx) {
	const href = asString(props.href);
	if (href !== undefined && /^(https?:|\/|#)/.test(href)) {
		return { before: '[', after: `](${absoluteUrl(href, ctx)})` };
	}
	const url = embeddedUrl(props.href, ctx);
	if (url === undefined || ctx.linkedAssets.has(url)) {
		return { text: '' };
	}
	ctx.linkedAssets.add(url);
	return { before: '[', after: `](${url})` };
}

/**
 * @param {Record<string, any>} props
 * @returns {ComponentReplacement | null}
 */
function renderTabItem(props) {
	const label = asString(props.label);
	// The label is the only part of a tab that lives outside its children.
	return label === undefined ? null : { before: `\n\n**${label}**\n\n` };
}

/**
 * The summary of a collapsed section is its title; in Markdown it reads as one.
 *
 * @param {MdastNode} node
 * @param {MdxComponentContext} ctx
 * @returns {ComponentReplacement | null}
 */
function renderSummary(node, ctx) {
	const text = ctx.textOf(node).replace(/\s+/g, ' ').trim();
	return text.length === 0 ? { text: '' } : { text: `\n\n**${text}**\n\n` };
}

/**
 * Site-absolute paths (`/img/x.png`) are resolved against the documentation
 * root so the Markdown works wherever it is read.
 *
 * @param {string} path
 * @param {MdxComponentContext} ctx
 * @returns {string}
 */
function absoluteUrl(path, ctx) {
	return path.startsWith('/') ? `${ctx.docsRootUrl}${path}` : path;
}

/**
 * The URL an embedded example is reachable at: a runnable page the build
 * publishes under a content-hashed name, or a plain URL written as-is.
 *
 * @param {any} value
 * @param {MdxComponentContext} ctx
 * @returns {string | undefined}
 */
function embeddedUrl(value, ctx) {
	if (typeof value === 'string') {
		return /^(https?:|\/)/.test(value) ? absoluteUrl(value, ctx) : undefined;
	}
	const path = value === null || typeof value !== 'object' ? undefined : value.asset;
	if (typeof path !== 'string') {
		return undefined;
	}
	// The build publishes most embedded files verbatim, which is what lets them
	// be found at all. The few it rewrites on the way out (it minifies the
	// JavaScript ones) are linked in the repository instead.
	const url = ctx.emittedAssetUrl(path) ?? ctx.repositoryFileUrl(path);
	if (url === undefined) {
		ctx.warn(`no published copy of ${path}; the example embedded from it is left out`);
	}
	return url;
}

/** @type {Record<string, (props: Record<string, any>, node: MdastNode, ctx: MdxComponentContext) => ComponentReplacement | null>} */
const RENDERERS = {
	CodeBlock: renderCodeBlock,
	CardLinkList: (props, _node, ctx) => renderCardLinkList(props, ctx),
	TabItem: props => renderTabItem(props),
	summary: (_props, node, ctx) => renderSummary(node, ctx),
	img: (props, _node, ctx) => renderImage(props, ctx),
	a: (props, _node, ctx) => renderAnchor(props, ctx),
	iframe: (props, _node, ctx) => renderIframe(props, ctx),
};

// Components that draw nothing a reader of the Markdown could use: the live
// chart demos (a canvas) and the banner that depends on which version the
// reader has selected. Listing them keeps the unhandled-component warning
// meaningful.
// The two list components on the tutorials landing page are also left out:
// each one renders the links of one sidebar category, and every page they
// would list is already in `llms.txt` and `docs_map.md` under that category.
const NO_CONTENT_COMPONENTS = new Set([
	'HowToList',
	'ExamplesList',
	'Chart',
	'ChartContainer',
	'ThemedChart',
	'BrowserOnly',
	'VersionWarningAdmonition',
]);

const PARTIAL_EXTENSIONS = /\.mdx?$/;

/**
 * Returns the Markdown for a JSX element, or `null` to let the caller fall back
 * to unwrapping it (dropping the tags, keeping the children).
 *
 * @param {MdastNode} node
 * @param {MdxComponentContext} ctx
 * @returns {ComponentReplacement | null}
 */
export function renderMdxComponent(node, ctx) {
	const name = node.name;
	if (name === null || name === undefined) {
		return null;
	}

	// A component imported from an .mdx/.md file is a content partial: its text
	// is part of the page a reader sees, so it is inlined here.
	const specifier = ctx.bindings.get(name)?.module;
	if (specifier !== undefined && PARTIAL_EXTENSIONS.test(specifier)) {
		const partial = ctx.renderPartial(resolveSpecifier(specifier, ctx)).trim();
		return partial.length > 0 ? { text: `\n\n${partial}\n\n` } : { text: '' };
	}

	if (NO_CONTENT_COMPONENTS.has(name)) {
		return { text: '' };
	}

	const props = readProps(node, ctx);
	const renderer = RENDERERS[name];
	if (renderer !== undefined) {
		return renderer(props, node, ctx);
	}

	// A component with children still contributes them; one without children
	// disappears silently, which is exactly the loss this module exists to stop.
	// (Plain HTML tags are left to the generic unwrapping.)
	if (/^[A-Z]/.test(name) && (node.children ?? []).length === 0) {
		ctx.warn(`no Markdown for <${name}>; its content is missing from the export`);
	}
	return null;
}

/**
 * @param {any} statement
 * @param {Map<string, Binding>} bindings
 */
function collectImportBindings(statement, bindings) {
	const source = statement.source?.value;
	if (typeof source !== 'string') {
		return;
	}
	for (const specifier of statement.specifiers ?? []) {
		if (specifier.local?.name !== undefined) {
			bindings.set(specifier.local.name, { module: source });
		}
	}
}

/**
 * @param {any} statement
 * @param {Map<string, Binding>} bindings
 */
function collectConstBindings(statement, bindings) {
	const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
	if (declaration?.type !== 'VariableDeclaration') {
		return;
	}
	for (const declarator of declaration.declarations ?? []) {
		if (declarator.id?.type === 'Identifier' && declarator.init !== null) {
			bindings.set(declarator.id.name, { expression: declarator.init });
		}
	}
}

/**
 * Collects the names a page declares — every ESM import, and the expression
 * behind every top-level const — so a prop or a `{child}` referring to one can
 * be resolved to its value.
 *
 * @param {MdastNode} tree
 * @returns {Map<string, Binding>}
 */
export function collectBindings(tree) {
	/** @type {Map<string, Binding>} */
	const bindings = new Map();
	for (const node of tree.children ?? []) {
		if (node.type !== 'mdxjsEsm') {
			continue;
		}
		for (const statement of node.data?.estree?.body ?? []) {
			if (statement.type === 'ImportDeclaration') {
				collectImportBindings(statement, bindings);
			} else {
				collectConstBindings(statement, bindings);
			}
		}
	}
	return bindings;
}

/**
 * Absolute directory of a page source (`@site/versioned_docs/version-5.2/a.md`),
 * used to resolve the relative imports on that page.
 *
 * @param {string} source
 * @param {string} siteDir
 * @returns {string}
 */
export function pageDirectory(source, siteDir) {
	return dirname(join(siteDir, source.replace(/^@site[\\/]?/, '')));
}
