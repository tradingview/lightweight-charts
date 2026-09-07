import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import semver from 'semver';
import Ajv from 'ajv';

const AjvCtor = Ajv.default ?? Ajv;
const SCHEMA_PATH = fileURLToPath(new URL('./lwc-plugin-metadata.schema.json', import.meta.url));

/**
 * The placeholders the create-lwc-plugin wizard substitutes, see
 * packages/create-lwc-plugin/src/scaffold.ts. Matched literally, so ordinary
 * `_emphasis_` or `SOME_CONSTANT` text is never mistaken for one.
 */
const SCAFFOLD_PLACEHOLDERS = [
	'_ATTACH_SNIPPET_',
	'_USAGE_SNIPPET_',
	'_ENTRYNAME_',
	'_PLUGINNAME_',
	'_CLASSNAME_',
	'_PACKAGENAME_',
	'_DESCRIPTION_',
	'_AUTHOR_',
	'_LICENSE_',
	'_PEERVERSION_',
	'_CATEGORY_',
];

/**
 * Checks whether a package name or folder matches the provided filter.
 *
 * @param {string} folderName - Directory name under packages/
 * @param {string} pkgName - Name field from package.json
 * @param {string} [filter] - Filter string
 * @returns {boolean}
 */
function matchesPluginFilter(folderName, pkgName, filter) {
	if (!filter) {
		return true;
	}
	const normalized = filter.trim();
	const shortName = folderName.replace(/^lwc-plugin-/, '');
	return (
		normalized === pkgName ||
		normalized === folderName ||
		normalized === shortName ||
		normalized === `@tradingview/${folderName}`
	);
}

/**
 * Finds all non-private workspace plugin packages under packages/lwc-plugin-*.
 *
 * @param {string} repoRoot - Absolute path to repository root.
 * @param {string} [filter] - Optional filter by package name, directory name, or short name.
 * @returns {Array<{ dir: string, packageJson: object, name: string, version: string | undefined }>}
 */
export function findWorkspacePlugins(repoRoot, filter) {
	const packagesDir = path.join(repoRoot, 'packages');
	if (!fs.existsSync(packagesDir)) {
		return [];
	}

	const entries = fs.readdirSync(packagesDir, { withFileTypes: true });
	const plugins = [];

	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue;
		}
		if (!entry.name.startsWith('lwc-plugin-')) {
			continue;
		}

		const dir = path.join(packagesDir, entry.name);
		const pkgJsonPath = path.join(dir, 'package.json');
		if (!fs.existsSync(pkgJsonPath)) {
			continue;
		}

		let pkg;
		try {
			pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
		} catch (e) {
			console.warn(`Warning: failed to parse package.json at ${pkgJsonPath}: ${e.message}`);
			continue;
		}

		// Private packages are never published, so the scripts skip them.
		if (pkg.private === true) {
			continue;
		}

		const name = pkg.name || entry.name;
		if (!matchesPluginFilter(entry.name, name, filter)) {
			continue;
		}

		plugins.push(toPluginDescriptor(dir, pkg));
	}

	return plugins;
}

/**
 * Builds the descriptor the scripts work with from a package directory and its manifest.
 */
function toPluginDescriptor(dir, packageJson) {
	return {
		dir,
		packageJson,
		name: packageJson.name || path.basename(dir),
		version: packageJson.version,
	};
}

/**
 * Resolves the packages a script operates on from its CLI options: `--path <dir>`
 * targets one directory, otherwise the workspace plugins, optionally narrowed by
 * `--filter <name>`.
 *
 * @param {string} repoRoot - Absolute path to repository root.
 * @param {{ path?: string, filter?: string }} [options]
 * @returns {Array<{ dir: string, packageJson: object, name: string, version: string | undefined }>}
 */
export function resolveTargetPlugins(repoRoot, { path: targetPath, filter } = {}) {
	if (targetPath) {
		const dir = path.resolve(process.cwd(), targetPath);
		const pkgJsonPath = path.join(dir, 'package.json');
		if (!fs.existsSync(pkgJsonPath)) {
			throw new Error(`No package.json found at ${dir}`);
		}
		return [toPluginDescriptor(dir, JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')))];
	}

	const plugins = findWorkspacePlugins(repoRoot, filter);
	if (plugins.length === 0 && filter) {
		throw new Error(`No workspace plugin packages found matching filter '${filter}'`);
	}
	return plugins;
}

/**
 * CLI wrapper around resolveTargetPlugins: reports an error or an empty
 * workspace and exits, so the scripts only ever see a non-empty list.
 */
export function loadTargetPlugins(repoRoot, options) {
	let plugins;
	try {
		plugins = resolveTargetPlugins(repoRoot, options);
	} catch (err) {
		console.error(`❌ ${err.message}`);
		process.exit(1);
	}
	if (plugins.length === 0) {
		console.log('ℹ️  No non-private workspace plugin packages found under packages/lwc-plugin-*');
		process.exit(0);
	}
	return plugins;
}

/**
 * Builds the library and the toolkit from the workspace. Plugin builds resolve
 * both through workspace links whose entry points live in `dist/`, so nothing
 * that compiles a plugin can run on a clean checkout before this has.
 *
 * @param {string} repoRoot - Absolute path to repository root.
 */
export function buildWorkspaceDependencies(repoRoot) {
	console.log('📦 Building the workspace library...');
	execSync('pnpm build', { cwd: repoRoot, stdio: 'inherit' });
	console.log('📦 Building @tradingview/lwc-toolkit...');
	execSync('pnpm --filter @tradingview/lwc-toolkit build', { cwd: repoRoot, stdio: 'inherit' });
}

/**
 * Compares a local package version against a remote npm registry version.
 *
 * @param {string} localVersion - Local version string.
 * @param {string | null} remoteVersion - Remote version string from npm, or null if unpublished.
 * @returns {{ isNewer: boolean, isBehind: boolean, localVersion: string, remoteVersion: string | null }}
 */
export function compareVersions(localVersion, remoteVersion) {
	const validLocal = semver.valid(localVersion);
	if (!validLocal) {
		throw new Error(`Invalid local version '${localVersion}'`);
	}
	if (!remoteVersion) {
		return { isNewer: true, isBehind: false, localVersion: validLocal, remoteVersion: null };
	}
	const validRemote = semver.valid(remoteVersion);
	if (!validRemote) {
		throw new Error(`Invalid registry version '${remoteVersion}'`);
	}
	return {
		isNewer: semver.gt(validLocal, validRemote),
		isBehind: semver.lt(validLocal, validRemote),
		localVersion: validLocal,
		remoteVersion: validRemote,
	};
}

/**
 * Parses an error from querying the npm registry.
 * Returns null if the package is unpublished (E404), otherwise throws.
 *
 * @param {any} error - Caught error object from execFileSync.
 * @param {string} packageName - Package name queried.
 * @returns {null}
 */
export function parseRemoteVersionError(error, packageName) {
	const stdout = error?.stdout ? error.stdout.toString() : '';
	let parsedError = null;
	try {
		parsedError = JSON.parse(stdout.trim());
	} catch {
		// Not JSON
	}

	if (parsedError && parsedError.error && parsedError.error.code === 'E404') {
		return null;
	}

	const stderr = error?.stderr ? error.stderr.toString() : '';
	const summary = parsedError?.error?.summary || stderr.trim() || error?.message || 'Unknown error';
	throw new Error(`Failed to query registry for '${packageName}': ${summary}`);
}

/**
 * Queries npm registry for the current published version of a package.
 * Only treats code E404 as unpublished (returning null). Any other error throws.
 *
 * @param {string} packageName - Package name to query.
 * @returns {string | null} The version string, or null if unpublished.
 */
export function getRemoteVersion(packageName) {
	try {
		const stdout = execFileSync('npm', ['view', packageName, 'version', '--json'], {
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		}).trim();
		if (!stdout) {
			return null;
		}
		const parsed = JSON.parse(stdout);
		return typeof parsed === 'string' ? parsed : null;
	} catch (error) {
		return parseRemoteVersionError(error, packageName);
	}
}

/**
 * Verifies that the package CHANGELOG contains an entry for the specified version.
 *
 * @param {string} changelogContent - Content of CHANGELOG.md.
 * @param {string} version - Target version string.
 * @returns {{ valid: boolean, message?: string }}
 */
export function verifyChangelog(changelogContent, version) {
	if (!changelogContent || typeof changelogContent !== 'string') {
		return { valid: false, message: 'CHANGELOG.md is empty or missing' };
	}

	const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const headerRegex = new RegExp(`^#{1,4}\\s+(?:\\[)?v?${escapedVersion}(?:\\]|\\s|$)`, 'm');

	if (headerRegex.test(changelogContent)) {
		return { valid: true };
	}

	return {
		valid: false,
		message: `CHANGELOG.md has no entry for version ${version}`,
	};
}

/**
 * Validates package naming, scope, and license fields.
 */
function validateNamingAndLicense(pkg, isOfficial) {
	const errors = [];
	const name = pkg.name || '';

	if (isOfficial && !name.startsWith('@tradingview/')) {
		errors.push(`Official package name must start with '@tradingview/' (got '${name}')`);
	}

	const unscopedName = name.slice(name.indexOf('/') + 1);
	if (!unscopedName.startsWith('lwc-plugin-')) {
		errors.push(`Package name must start with 'lwc-plugin-' (got '${unscopedName}')`);
	}

	if (!pkg.license || typeof pkg.license !== 'string' || pkg.license.trim().length === 0) {
		errors.push(`Missing or empty 'license' field in package.json`);
	}

	// The catalogue card shows the root description, so it is part of the contract.
	if (typeof pkg.description !== 'string' || pkg.description.trim().length === 0) {
		errors.push(`Missing or empty 'description' field in package.json`);
	}

	return errors;
}

/**
 * Lists the wizard placeholders still present in a file's text, e.g. `_DESCRIPTION_`.
 *
 * @param {string} text
 * @returns {string[]} Placeholders found, in order of first appearance.
 */
export function findPlaceholders(text) {
	return SCAFFOLD_PLACEHOLDERS
		.map(placeholder => [placeholder, text.indexOf(placeholder)])
		.filter(([, index]) => index !== -1)
		.sort((a, b) => a[1] - b[1])
		.map(([placeholder]) => placeholder);
}

/**
 * Error messages for scaffold placeholders left in a package file, if any.
 */
function placeholderErrors(fileLabel, text) {
	const found = findPlaceholders(text);
	return found.length > 0 ? [`${fileLabel} still contains scaffold placeholders: ${found.join(', ')}`] : [];
}

/**
 * Validates dependencies, publishConfig, and keywords contract.
 */
function validateDependenciesAndKeywords(pkg) {
	const errors = [];

	if (!semver.valid(pkg.version)) {
		errors.push(`'version' must be a valid semver version (got '${pkg.version}')`);
	}

	if (!pkg.publishConfig || pkg.publishConfig.access !== 'public') {
		errors.push(`'publishConfig.access' must be set to 'public'`);
	}

	const peerRange = pkg.peerDependencies && pkg.peerDependencies['lightweight-charts'];
	if (!peerRange || typeof peerRange !== 'string' || !semver.validRange(peerRange)) {
		errors.push(
			`'peerDependencies.lightweight-charts' must be a valid semver range (got '${peerRange}')`
		);
	}

	if (!Array.isArray(pkg.keywords) || !pkg.keywords.includes('lightweight-charts-plugin')) {
		errors.push(`'keywords' must include 'lightweight-charts-plugin'`);
	}

	return errors;
}

/**
 * Validates the lwcPlugin block against the JSON Schema and official rules.
 */
function validateLwcPluginBlock(lwcPlugin, isOfficial) {
	const errors = [];
	if (!lwcPlugin || typeof lwcPlugin !== 'object') {
		errors.push(`Missing 'lwcPlugin' configuration block in package.json`);
		return errors;
	}

	const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
	const ajv = new AjvCtor({ allErrors: true });
	const validate = ajv.compile(schema);
	const isValid = validate(lwcPlugin);

	if (!isValid) {
		for (const err of validate.errors || []) {
			errors.push(`lwcPlugin schema error: ${err.instancePath || '/'} ${err.message}`);
		}
	}

	if (isOfficial && lwcPlugin.origin !== 'official') {
		errors.push(
			`Official workspace plugin must have 'lwcPlugin.origin' set to 'official' (got '${lwcPlugin.origin}')`
		);
	}

	return errors;
}

/**
 * Validates package.json contract and lwcPlugin metadata against JSON schema.
 *
 * @param {string} packageDir - Absolute path to package directory.
 * @param {{ isOfficial?: boolean }} [options]
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePackageMetadata(packageDir, { isOfficial = true } = {}) {
	const pkgJsonPath = path.join(packageDir, 'package.json');
	if (!fs.existsSync(pkgJsonPath)) {
		return { valid: false, errors: [`package.json not found in ${packageDir}`] };
	}

	const pkgJsonText = fs.readFileSync(pkgJsonPath, 'utf-8');
	let pkg;
	try {
		pkg = JSON.parse(pkgJsonText);
	} catch (e) {
		return { valid: false, errors: [`Invalid JSON in package.json: ${e.message}`] };
	}

	const errors = [
		...validateNamingAndLicense(pkg, isOfficial),
		...validateDependenciesAndKeywords(pkg),
		...validateLwcPluginBlock(pkg.lwcPlugin, isOfficial),
	];

	errors.push(...placeholderErrors('package.json', pkgJsonText));

	// README.md validation
	const readmePath = ['README.md', 'readme.md']
		.map(file => path.join(packageDir, file))
		.find(f => fs.existsSync(f));

	if (!readmePath) {
		errors.push(`README.md is missing in ${packageDir}`);
	} else {
		const readmeContent = fs.readFileSync(readmePath, 'utf-8');
		const readmeValidation = validateReadmeContent(readmeContent);
		if (!readmeValidation.valid) {
			errors.push(...readmeValidation.errors);
		}
		errors.push(...placeholderErrors('README.md', readmeContent));
	}

	// The scaffold fills these two as well.
	for (const file of ['CHANGELOG.md', 'NOTICE']) {
		const filePath = path.join(packageDir, file);
		if (fs.existsSync(filePath)) {
			errors.push(...placeholderErrors(file, fs.readFileSync(filePath, 'utf-8')));
		}
	}

	// Demo file existence: strictly checks the declared demo path in lwcPlugin.demo
	if (pkg.lwcPlugin && typeof pkg.lwcPlugin.demo === 'string') {
		const demoPath = path.join(packageDir, pkg.lwcPlugin.demo);
		if (!fs.existsSync(demoPath)) {
			errors.push(`Declared demo file '${pkg.lwcPlugin.demo}' does not exist in ${packageDir}`);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Marks the lines that sit inside fenced code blocks, so that a `## comment`
 * inside a shell snippet is not taken for a heading.
 *
 * @param {string[]} lines
 * @returns {boolean[]}
 */
function fencedLines(lines) {
	let inFence = false;
	return lines.map(line => {
		if (/^\s*(```|~~~)/.test(line)) {
			inFence = !inFence;
			return true;
		}
		return inFence;
	});
}

/**
 * Whether any text follows the top heading before the first level-2 heading.
 */
function hasDescriptionParagraph(lines, fenced, topHeadingIndex) {
	for (let i = topHeadingIndex + 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!fenced[i] && /^##\s+/.test(line)) {
			return false;
		}
		if (line.length > 0) {
			return true;
		}
	}
	return false;
}

/**
 * Returns the body of the level-2 section whose heading matches, up to the next
 * level-2 heading, or null when there is no such section.
 */
function sectionBody(lines, fenced, headingPattern) {
	const start = lines.findIndex((line, i) => !fenced[i] && headingPattern.test(line));
	if (start === -1) {
		return null;
	}
	let end = lines.length;
	for (let i = start + 1; i < lines.length; i++) {
		if (!fenced[i] && /^##\s/.test(lines[i])) {
			end = i;
			break;
		}
	}
	return lines.slice(start + 1, end).join('\n');
}

/**
 * Validates the README structure the plugin catalogue renders:
 * - a description paragraph under the top heading (HTML comments ignored)
 * - an Installation section with the `### npm` and `### CDN` tabs
 * - a Usage section with a JavaScript/TypeScript example
 *
 * @param {string} content - Markdown content of README.md.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateReadmeContent(content) {
	const errors = [];
	if (!content || !content.trim()) {
		return { valid: false, errors: ['README.md is empty'] };
	}

	// Strip HTML comments before checking description and sections
	const stripped = content.replace(/<!--[\s\S]*?-->/g, '');
	const lines = stripped.split(/\r?\n/);
	const fenced = fencedLines(lines);
	const topHeadingIndex = lines.findIndex((line, i) => !fenced[i] && /^#\s+/.test(line));

	if (topHeadingIndex === -1) {
		errors.push(`README.md missing top level heading ('# <Plugin Name>')`);
	} else if (!hasDescriptionParagraph(lines, fenced, topHeadingIndex)) {
		errors.push(`README.md must have a description paragraph at the top`);
	}

	const installation = sectionBody(lines, fenced, /^##\s+Installation\b/i);
	if (installation === null) {
		errors.push(`README.md missing Installation section ('## Installation')`);
	} else {
		for (const tab of ['npm', 'CDN']) {
			if (!new RegExp(`^###\\s+${tab}\\b`, 'im').test(installation)) {
				errors.push(`README.md Installation section missing the '### ${tab}' subsection`);
			}
		}
	}

	const usage = sectionBody(lines, fenced, /^##\s+Usage\b/i);
	if (usage === null) {
		errors.push(`README.md missing Usage section ('## Usage')`);
	} else if (!/```(?:js|javascript|ts|typescript)\b/.test(usage)) {
		errors.push(`README.md missing JavaScript/TypeScript usage code block`);
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Extracts integration code snippet from README.md, along with language tag.
 *
 * @param {string} readmePath - Path to README.md.
 * @returns {{ code: string, lang: 'ts' | 'js' }}
 */
export function extractReadmeSnippet(readmePath) {
	if (!fs.existsSync(readmePath)) {
		return { code: '', lang: 'js' };
	}
	const content = fs.readFileSync(readmePath, 'utf-8');

	const blockRegex = /```(js|javascript|ts|typescript)\r?\n([\s\S]*?)```/gi;
	const blocks = [];
	for (const match of content.matchAll(blockRegex)) {
		blocks.push({
			lang: match[1].toLowerCase().startsWith('ts') ? 'ts' : 'js',
			code: match[2].trim(),
			index: match.index,
		});
	}

	if (blocks.length === 0) {
		return { code: '', lang: 'js' };
	}

	const npmIndex = content.search(/###\s+npm/i);
	if (npmIndex !== -1) {
		const npmBlock = blocks.find(b => b.index > npmIndex);
		if (npmBlock) {
			return { code: npmBlock.code, lang: npmBlock.lang };
		}
	}

	const usageIndex = content.search(/##\s+Usage/i);
	if (usageIndex !== -1) {
		const usageBlock = blocks.find(b => b.index > usageIndex);
		if (usageBlock) {
			return { code: usageBlock.code, lang: usageBlock.lang };
		}
	}

	return { code: blocks[0].code, lang: blocks[0].lang };
}

/**
 * Extracts entrypoint paths from package.json manifest.
 */
function extractDeclaredEntrypoints(packageJson) {
	const expectedFiles = new Set();
	if (packageJson.main) {
		expectedFiles.add(packageJson.main.replace(/^\.\//, ''));
	}
	if (packageJson.module) {
		expectedFiles.add(packageJson.module.replace(/^\.\//, ''));
	}
	if (packageJson.types) {
		expectedFiles.add(packageJson.types.replace(/^\.\//, ''));
	}
	if (packageJson.typings) {
		expectedFiles.add(packageJson.typings.replace(/^\.\//, ''));
	}

	if (packageJson.exports && typeof packageJson.exports === 'object') {
		const collectExports = obj => {
			for (const val of Object.values(obj)) {
				if (typeof val === 'string') {
					expectedFiles.add(val.replace(/^\.\//, ''));
				} else if (typeof val === 'object' && val !== null) {
					collectExports(val);
				}
			}
		};
		collectExports(packageJson.exports);
	}

	return expectedFiles;
}

/**
 * Inspects a packaged .tgz tarball to verify required files:
 * - LICENSE
 * - NOTICE
 * - Entrypoint files from package.json (main, module, types, exports)
 *
 * @param {string} tarballPath - Absolute path to .tgz file.
 * @param {object} packageJson - Parsed package.json object.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function verifyPackContent(tarballPath, packageJson) {
	const errors = [];
	if (!fs.existsSync(tarballPath)) {
		return { valid: false, errors: [`Tarball not found at ${tarballPath}`] };
	}

	let tarList;
	try {
		tarList = execFileSync('tar', ['-tf', tarballPath], { encoding: 'utf-8' });
	} catch (e) {
		return { valid: false, errors: [`Failed to inspect tarball with tar -tf: ${e.message}`] };
	}

	const files = tarList
		.split(/\r?\n/)
		.map(f => f.trim().replace(/^package\//, ''))
		.filter(Boolean);

	if (!files.some(f => /^LICENSE(?:\.[a-zA-Z0-9]+)?$/i.test(f))) {
		errors.push(`Tarball missing LICENSE file`);
	}

	if (!files.some(f => /^NOTICE(?:\.[a-zA-Z0-9]+)?$/i.test(f))) {
		errors.push(`Tarball missing NOTICE file`);
	}

	const expectedFiles = extractDeclaredEntrypoints(packageJson);
	for (const expected of expectedFiles) {
		if (expected === 'package.json') {
			continue;
		}
		if (!files.includes(expected)) {
			errors.push(`Tarball missing declared entrypoint: '${expected}'`);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Downloads the published tarball of a package version and extracts it.
 *
 * @param {string} packageName
 * @param {string} version
 * @param {string} destDir - Empty directory to download into.
 * @returns {string} Path of the extracted `package/` directory.
 */
export function fetchPublishedPackage(packageName, version, destDir) {
	execFileSync('npm', ['pack', `${packageName}@${version}`, '--pack-destination', destDir], {
		stdio: ['pipe', 'pipe', 'pipe'],
	});
	const tgz = fs.readdirSync(destDir).find(f => f.endsWith('.tgz'));
	if (!tgz) {
		throw new Error(`npm pack produced no tarball for ${packageName}@${version}`);
	}
	execFileSync('tar', ['-xzf', path.join(destDir, tgz), '-C', destDir]);
	return path.join(destDir, 'package');
}

function listFilesRecursively(dir, prefix = '') {
	if (!fs.existsSync(dir)) {
		return [];
	}
	const files = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			files.push(...listFilesRecursively(path.join(dir, entry.name), relative));
		} else {
			files.push(relative);
		}
	}
	return files.sort();
}

/**
 * Compares two build output directories file by file.
 *
 * @param {string} localDir - Freshly built output.
 * @param {string} publishedDir - Output extracted from the published tarball.
 * @returns {{ identical: boolean, added: string[], removed: string[], changed: string[] }}
 */
export function compareDistDirs(localDir, publishedDir) {
	const local = listFilesRecursively(localDir);
	const published = new Set(listFilesRecursively(publishedDir));
	const localSet = new Set(local);

	const added = local.filter(f => !published.has(f));
	const removed = [...published].filter(f => !localSet.has(f));
	const changed = local.filter(f =>
		published.has(f) &&
		!fs.readFileSync(path.join(localDir, f)).equals(fs.readFileSync(path.join(publishedDir, f)))
	);

	return {
		identical: added.length === 0 && removed.length === 0 && changed.length === 0,
		added,
		removed,
		changed,
	};
}

/**
 * Decides what a difference between the built and the published output means
 * for a plugin: changed output needs a release, so it fails unless the version
 * was bumped; a bump with identical output is legitimate (README or metadata
 * only) but worth a look.
 *
 * @param {{ outputDiffers: boolean, versionBumped: boolean }} input
 * @returns {{ status: 'pass' | 'warn' | 'fail', message: string }}
 */
export function classifyStaleness({ outputDiffers, versionBumped }) {
	if (outputDiffers && !versionBumped) {
		return { status: 'fail', message: 'the shipped output changed but the version was not bumped' };
	}
	if (outputDiffers) {
		return { status: 'pass', message: 'the output changed and the version was bumped' };
	}
	if (versionBumped) {
		return { status: 'warn', message: 'the version was bumped but the built output is identical to the published one' };
	}
	return { status: 'pass', message: 'up to date with the published version' };
}
