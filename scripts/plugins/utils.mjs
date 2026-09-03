import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import semver from 'semver';
import Ajv from 'ajv';

const AjvCtor = Ajv.default ?? Ajv;

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
 * Compares a local package version against a remote npm registry version.
 *
 * @param {string} localVersion - Local version string.
 * @param {string | null} remoteVersion - Remote version string from npm, or null if unpublished.
 * @returns {{ isNewer: boolean, localVersion: string, remoteVersion: string | null }}
 */
export function compareVersions(localVersion, remoteVersion) {
	const validLocal = semver.valid(localVersion);
	if (!validLocal) {
		throw new Error(`Invalid local version '${localVersion}'`);
	}
	if (!remoteVersion) {
		return { isNewer: true, localVersion: validLocal, remoteVersion: null };
	}
	const validRemote = semver.valid(remoteVersion);
	if (!validRemote) {
		throw new Error(`Invalid registry version '${remoteVersion}'`);
	}
	return {
		isNewer: semver.gt(validLocal, validRemote),
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

	return errors;
}

/**
 * Validates dependencies, publishConfig, and keywords contract.
 */
function validateDependenciesAndKeywords(pkg) {
	const errors = [];

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

	const schemaPath = path.resolve(
		path.dirname(new URL(import.meta.url).pathname),
		'lwc-plugin-metadata.schema.json'
	);
	const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
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

	let pkg;
	try {
		pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
	} catch (e) {
		return { valid: false, errors: [`Invalid JSON in package.json: ${e.message}`] };
	}

	const errors = [
		...validateNamingAndLicense(pkg, isOfficial),
		...validateDependenciesAndKeywords(pkg),
		...validateLwcPluginBlock(pkg.lwcPlugin, isOfficial),
	];

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
 * Validates README structure for required registry sections:
 * - Description at the top (with HTML comments stripped)
 * - Installation section
 * - Usage example code block
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
	const topHeadingIndex = lines.findIndex(line => /^#\s+/.test(line));

	if (topHeadingIndex === -1) {
		errors.push(`README.md missing top level heading ('# <Plugin Name>')`);
	} else {
		let hasDescription = false;
		for (let i = topHeadingIndex + 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (/^##\s+/.test(line)) {
				break;
			}
			if (line.length > 0) {
				hasDescription = true;
				break;
			}
		}
		if (!hasDescription) {
			errors.push(`README.md must have a description paragraph at the top`);
		}
	}

	if (!/(?:^|\n)##+\s+.*install/i.test(stripped)) {
		errors.push(`README.md missing Installation section ('## Installation')`);
	}

	if (!/(?:^|\n)##+\s+.*usage/i.test(stripped)) {
		errors.push(`README.md missing Usage section ('## Usage')`);
	} else if (!/```(?:js|javascript|ts|typescript)/.test(stripped)) {
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
