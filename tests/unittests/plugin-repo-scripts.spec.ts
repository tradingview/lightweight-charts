/* eslint-disable
	@typescript-eslint/no-floating-promises,
	@typescript-eslint/no-explicit-any,
	@typescript-eslint/no-unused-expressions,
	@typescript-eslint/naming-convention,
	@typescript-eslint/tslint/config,
	@typescript-eslint/no-unsafe-argument
*/
import { expect } from 'chai';
import { describe, it } from 'node:test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
	findWorkspacePlugins,
	resolveTargetPlugins,
	compareVersions,
	parseRemoteVersionError,
	verifyChangelog,
	validatePackageMetadata,
	validateReadmeContent,
	findPlaceholders,
	extractReadmeSnippet,
	verifyPackContent,
	compareDistDirs,
	classifyStaleness,
} from '../../scripts/plugins/utils.mjs';

const validFixtureDir = fileURLToPath(new URL('../fixtures/plugins/valid-plugin', import.meta.url));
const malformedFixtureDir = fileURLToPath(new URL('../fixtures/plugins/malformed-metadata', import.meta.url));

const minimalValidReadme = [
	'# Test',
	'',
	'Desc',
	'',
	'## Installation',
	'',
	'### npm',
	'',
	'```js',
	'hi',
	'```',
	'',
	'### CDN',
	'',
	'```html',
	'<script type="importmap">{}</script>',
	'```',
	'',
	'## Usage',
	'',
	'```js',
	'hi',
	'```',
	'',
].join('\n');

describe('Plugin Repo Scripts Unit Tests', () => {
	describe('Workspace Plugin Discovery (findWorkspacePlugins)', () => {
		it('should find non-private lwc-plugin-* packages and exclude private ones', () => {
			const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-find-plugins-'));
			try {
				const packagesDir = path.join(tempRoot, 'packages');
				fs.mkdirSync(packagesDir, { recursive: true });

				// 1. Non-private plugin
				const plugin1Dir = path.join(packagesDir, 'lwc-plugin-alpha');
				fs.mkdirSync(plugin1Dir);
				fs.writeFileSync(
					path.join(plugin1Dir, 'package.json'),
					JSON.stringify({ name: '@tradingview/lwc-plugin-alpha', version: '1.0.0', private: false })
				);

				// 2. Private plugin (must be excluded)
				const plugin2Dir = path.join(packagesDir, 'lwc-plugin-beta');
				fs.mkdirSync(plugin2Dir);
				fs.writeFileSync(
					path.join(plugin2Dir, 'package.json'),
					JSON.stringify({ name: '@tradingview/lwc-plugin-beta', version: '1.0.0', private: true })
				);

				// 3. Non-plugin package (should be ignored)
				const otherDir = path.join(packagesDir, 'other-pkg');
				fs.mkdirSync(otherDir);
				fs.writeFileSync(
					path.join(otherDir, 'package.json'),
					JSON.stringify({ name: 'other-pkg', version: '1.0.0' })
				);

				const plugins = findWorkspacePlugins(tempRoot);
				expect(plugins).to.have.lengthOf(1);
				expect(plugins[0].name).to.equal('@tradingview/lwc-plugin-alpha');
				expect(path.basename(plugins[0].dir)).to.equal('lwc-plugin-alpha');
				expect(plugins[0].version).to.equal('1.0.0');
			} finally {
				fs.rmSync(tempRoot, { recursive: true, force: true });
			}
		});

		it('should filter plugins by full name, folder name, or short name', () => {
			const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-find-plugins-'));
			try {
				const packagesDir = path.join(tempRoot, 'packages');
				fs.mkdirSync(packagesDir, { recursive: true });

				const dirA = path.join(packagesDir, 'lwc-plugin-foo');
				fs.mkdirSync(dirA);
				fs.writeFileSync(path.join(dirA, 'package.json'), JSON.stringify({ name: '@tradingview/lwc-plugin-foo' }));

				const dirB = path.join(packagesDir, 'lwc-plugin-bar');
				fs.mkdirSync(dirB);
				fs.writeFileSync(path.join(dirB, 'package.json'), JSON.stringify({ name: '@tradingview/lwc-plugin-bar' }));

				expect(findWorkspacePlugins(tempRoot, 'foo')).to.have.lengthOf(1);
				expect(findWorkspacePlugins(tempRoot, 'lwc-plugin-foo')).to.have.lengthOf(1);
				expect(findWorkspacePlugins(tempRoot, '@tradingview/lwc-plugin-foo')).to.have.lengthOf(1);
				expect(findWorkspacePlugins(tempRoot, 'non-existent')).to.have.lengthOf(0);
			} finally {
				fs.rmSync(tempRoot, { recursive: true, force: true });
			}
		});

		it('should resolve --path to a single package and reject a directory without package.json', () => {
			const [plugin] = resolveTargetPlugins('/nonexistent-root', { path: validFixtureDir });
			expect(plugin.dir).to.equal(validFixtureDir);
			expect(plugin.name).to.equal('@tradingview/lwc-plugin-valid-sample');
			expect(plugin.version).to.equal('1.0.0');

			expect(() => resolveTargetPlugins('/nonexistent-root', { path: os.tmpdir() }))
				.to.throw(/No package\.json found/);
		});

		it('should reject a --filter that matches no workspace package', () => {
			const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-resolve-'));
			try {
				fs.mkdirSync(path.join(tempRoot, 'packages'));
				expect(resolveTargetPlugins(tempRoot)).to.have.lengthOf(0);
				expect(() => resolveTargetPlugins(tempRoot, { filter: 'nope' }))
					.to.throw(/No workspace plugin packages found matching filter 'nope'/);
			} finally {
				fs.rmSync(tempRoot, { recursive: true, force: true });
			}
		});
	});

	describe('Registry Query & Version Comparison', () => {
		it('should identify local version as newer when local > remote', () => {
			const result = compareVersions('1.1.0', '1.0.0');
			expect(result.isNewer).to.be.true;
			expect(result.localVersion).to.equal('1.1.0');
			expect(result.remoteVersion).to.equal('1.0.0');
		});

		it('should identify local version as not newer when local == remote', () => {
			const result = compareVersions('1.0.0', '1.0.0');
			expect(result.isNewer).to.be.false;
		});

		it('should identify local version as not newer when local < remote', () => {
			const result = compareVersions('1.0.0', '1.0.1');
			expect(result.isNewer).to.be.false;
			expect(result.isBehind).to.be.true;
			expect(compareVersions('1.0.1', '1.0.1').isBehind).to.be.false;
			expect(compareVersions('1.0.0', null).isBehind).to.be.false;
		});

		it('should treat null remote version as a new package and return isNewer = true', () => {
			const result = compareVersions('1.0.0', null);
			expect(result.isNewer).to.be.true;
			expect(result.remoteVersion).to.be.null;
		});

		it('should reject an invalid local version instead of silently skipping it', () => {
			expect(() => compareVersions('not-a-version', '1.0.0')).to.throw(/Invalid local version 'not-a-version'/);
			expect(() => compareVersions(undefined as any, null)).to.throw(/Invalid local version/);
		});

		it('should treat E404 error as unpublished (returning null)', () => {
			const mock404Error = {
				stdout: JSON.stringify({
					error: {
						code: 'E404',
						summary: 'Not Found',
					},
				}),
				stderr: '',
			};
			const result = parseRemoteVersionError(mock404Error, '@tradingview/lwc-plugin-foo');
			expect(result).to.be.null;
		});

		it('should throw on non-404 registry errors', () => {
			const mock500Error = {
				stdout: JSON.stringify({
					error: {
						code: 'E500',
						summary: 'Internal Server Error',
					},
				}),
				stderr: '',
			};
			expect(() => {
				parseRemoteVersionError(mock500Error, '@tradingview/lwc-plugin-foo');
			}).to.throw(/Failed to query registry for '@tradingview\/lwc-plugin-foo': Internal Server Error/);
		});
	});

	describe('Changelog Verification (verifyChangelog)', () => {
		const sampleChangelog = `
# Changelog

All notable changes are documented here.

## 1.1.0 - 2026-09-01
### Added
- New features

## [1.0.0]
### Added
- Initial release
`;

		it('should pass when version header exists as ## X.Y.Z', () => {
			const result = verifyChangelog(sampleChangelog, '1.1.0');
			expect(result.valid).to.be.true;
		});

		it('should pass when version header exists as ## [X.Y.Z]', () => {
			const result = verifyChangelog(sampleChangelog, '1.0.0');
			expect(result.valid).to.be.true;
		});

		it('should fail when version header does not exist', () => {
			const result = verifyChangelog(sampleChangelog, '1.2.0');
			expect(result.valid).to.be.false;
			expect(result.message).to.include('CHANGELOG.md has no entry for version 1.2.0');
		});

		it('should fail when changelog is empty or null', () => {
			expect(verifyChangelog('', '1.0.0').valid).to.be.false;
			expect(verifyChangelog(null as any, '1.0.0').valid).to.be.false;
		});
	});

	describe('README Content Validation (validateReadmeContent)', () => {
		const validReadme = `
# Test Plugin

A helpful test plugin for lightweight charts.

<!-- An HTML comment right under the description -->

## Installation

### npm

\`\`\`shell
npm install @tradingview/lwc-plugin-test
\`\`\`

\`\`\`js
import { createChart } from 'lightweight-charts';
\`\`\`

### CDN

\`\`\`html
<script type="importmap">{ "imports": {} }</script>
\`\`\`

## Usage

\`\`\`js
const chart = createChart(document.getElementById('container'));
\`\`\`
`;

		it('should pass for a fully compliant README', () => {
			const result = validateReadmeContent(validReadme);
			expect(result.valid).to.be.true;
			expect(result.errors).to.be.empty;
		});

		it('should strip HTML comments and fail when description at the top is missing', () => {
			const invalid = `
# Test Plugin

<!--
Multi-line comment where author removed the description
-->

## Installation
\`\`\`shell
npm install test
\`\`\`
\`\`\`js
code
\`\`\`

## Usage
\`\`\`js
code
\`\`\`
`;
			const result = validateReadmeContent(invalid);
			expect(result.valid).to.be.false;
			expect(result.errors).to.include('README.md must have a description paragraph at the top');
		});

		it('should fail when Installation section is missing', () => {
			const invalid = `
# Test Plugin

Description here.

## Usage
\`\`\`js
code
\`\`\`
`;
			const result = validateReadmeContent(invalid);
			expect(result.valid).to.be.false;
			expect(result.errors).to.include("README.md missing Installation section ('## Installation')");
		});

		it('should require the npm and CDN tabs under Installation', () => {
			const noCdn = `
# Test Plugin

Description here.

## Installation

### npm

\`\`\`shell
npm install test
\`\`\`

## Usage

\`\`\`js
code
\`\`\`
`;
			const result = validateReadmeContent(noCdn);
			expect(result.valid).to.be.false;
			expect(result.errors).to.include("README.md Installation section missing the '### CDN' subsection");
			expect(result.errors).to.not.include("README.md Installation section missing the '### npm' subsection");
		});

		it('should ignore heading-like lines inside fenced code blocks', () => {
			const withFencedComment = `
# Test Plugin

Description here.

## Installation

### npm

\`\`\`shell
## not a heading, a shell comment
npm install test
\`\`\`

### CDN

\`\`\`html
<script type="importmap">{}</script>
\`\`\`

## Usage

\`\`\`js
code
\`\`\`
`;
			expect(validateReadmeContent(withFencedComment).errors).to.be.empty;
		});

		it('should not accept an Uninstall heading as the Installation section', () => {
			const uninstall = `
# Test Plugin

Description here.

## Uninstall

### npm

### CDN

## Usage

\`\`\`js
code
\`\`\`
`;
			const result = validateReadmeContent(uninstall);
			expect(result.errors).to.include("README.md missing Installation section ('## Installation')");
		});

		it('should fail when Usage code block is missing', () => {
			const invalid = `
# Test Plugin

Description here.

## Installation
Install instructions.

## Usage
No code block provided here.
`;
			const result = validateReadmeContent(invalid);
			expect(result.valid).to.be.false;
			expect(result.errors).to.include('README.md missing JavaScript/TypeScript usage code block');
		});
	});

	describe('Scaffold placeholders (findPlaceholders)', () => {
		it('should find wizard placeholders and ignore ordinary identifiers and emphasis', () => {
			const text = 'Uses _DESCRIPTION_ and _ATTACH_SNIPPET_, but not _NOTE_, MAX_VALUE, SOME_ENV_VAR or __dirname.';
			expect(findPlaceholders(text)).to.deep.equal(['_DESCRIPTION_', '_ATTACH_SNIPPET_']);
			expect(findPlaceholders('nothing here')).to.deep.equal([]);
		});
	});

	describe('README Snippet Extraction (extractReadmeSnippet)', () => {
		it('should extract JavaScript code block and language tag under ### npm', () => {
			const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-snippet-test-'));
			const readmePath = path.join(tempDir, 'README.md');
			try {
				fs.writeFileSync(readmePath, `
# Plugin
Description.

## Installation
### npm
\`\`\`shell
npm install pkg
\`\`\`
Then import:
\`\`\`js
import { Plugin } from 'pkg';
\`\`\`
## Usage
\`\`\`js
const p = new Plugin();
\`\`\`
`);
				const { code, lang } = extractReadmeSnippet(readmePath);
				expect(code).to.equal("import { Plugin } from 'pkg';");
				expect(lang).to.equal('js');
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		});

		it('should extract TypeScript code block with lang = ts', () => {
			const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-snippet-test-'));
			const readmePath = path.join(tempDir, 'README.md');
			try {
				fs.writeFileSync(readmePath, `
# Plugin
Description.

## Installation
### npm
\`\`\`ts
import { Plugin } from 'pkg';
const p = new Plugin();
\`\`\`
`);
				const { code, lang } = extractReadmeSnippet(readmePath);
				expect(code).to.include("import { Plugin } from 'pkg';");
				expect(lang).to.equal('ts');
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	describe('Metadata and Package Contract Validation (validatePackageMetadata)', () => {
		it('should pass on valid-plugin fixture', () => {
			const result = validatePackageMetadata(validFixtureDir, { isOfficial: true });
			expect(result.valid).to.be.true;
			expect(result.errors).to.be.empty;
		});

		it('should fail with detailed errors on malformed-metadata fixture', () => {
			const result = validatePackageMetadata(malformedFixtureDir, { isOfficial: true });
			expect(result.valid).to.be.false;
			expect(result.errors.length).to.be.greaterThan(0);

			const allErrors = result.errors.join(' | ');
			expect(allErrors).to.include('@tradingview/');
			expect(allErrors).to.include('lwc-plugin-');
			expect(allErrors).to.include('publishConfig.access');
			expect(allErrors).to.include('peerDependencies.lightweight-charts');
			expect(allErrors).to.include('lightweight-charts-plugin');
		});

		it('should require a description, a valid version and no scaffold placeholders', () => {
			const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-contract-test-'));
			try {
				const pkg = {
					name: '@tradingview/lwc-plugin-test',
					version: 'next',
					description: '_DESCRIPTION_',
					license: 'Apache-2.0',
					publishConfig: { access: 'public' },
					peerDependencies: { 'lightweight-charts': '^5.0.0' },
					keywords: ['lightweight-charts-plugin'],
					lwcPlugin: {
						title: 'Test',
						category: 'series-primitive',
						lifecycle: 'current',
						origin: 'official',
						demo: 'src/example/index.html',
					},
				};
				fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(pkg, null, 2));
				fs.writeFileSync(path.join(tempDir, 'README.md'), '# _PLUGINNAME_\n\nDesc\n');
				fs.writeFileSync(path.join(tempDir, 'CHANGELOG.md'), '# Changelog\n\n## 1.0.0\n\n- Initial release of _PLUGINNAME_.\n');

				const result = validatePackageMetadata(tempDir, { isOfficial: true });
				expect(result.valid).to.be.false;
				expect(result.errors).to.include("'version' must be a valid semver version (got 'next')");
				expect(result.errors).to.include('package.json still contains scaffold placeholders: _DESCRIPTION_');
				expect(result.errors).to.include('README.md still contains scaffold placeholders: _PLUGINNAME_');
				expect(result.errors).to.include('CHANGELOG.md still contains scaffold placeholders: _PLUGINNAME_');

				delete (pkg as { description?: string }).description;
				fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(pkg, null, 2));
				expect(validatePackageMetadata(tempDir, { isOfficial: true }).errors)
					.to.include("Missing or empty 'description' field in package.json");
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		});

		it('should fail if declared demo path does not exist', () => {
			const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-demo-test-'));
			try {
				const pkg = {
					name: '@tradingview/lwc-plugin-test',
					version: '1.0.0',
					license: 'Apache-2.0',
					publishConfig: { access: 'public' },
					peerDependencies: { 'lightweight-charts': '^5.0.0' },
					keywords: ['lightweight-charts-plugin'],
					lwcPlugin: {
						title: 'Test',
						category: 'series-primitive',
						lifecycle: 'current',
						origin: 'official',
						demo: 'src/example/index.html',
					},
				};
				fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(pkg, null, 2));
				fs.writeFileSync(path.join(tempDir, 'README.md'), minimalValidReadme);

				const result = validatePackageMetadata(tempDir, { isOfficial: true });
				expect(result.valid).to.be.false;
				expect(result.errors.some((e: string) => e.includes("Declared demo file 'src/example/index.html' does not exist"))).to.be.true;
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		});

		it('should fail if lwcPlugin contains unexpected additional properties', () => {
			const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-meta-test-'));
			try {
				const pkg = {
					name: '@tradingview/lwc-plugin-test',
					version: '1.0.0',
					license: 'Apache-2.0',
					publishConfig: { access: 'public' },
					peerDependencies: { 'lightweight-charts': '^5.0.0' },
					keywords: ['lightweight-charts-plugin'],
					lwcPlugin: {
						title: 'Test',
						category: 'series-primitive',
						lifecycle: 'current',
						origin: 'official',
						demo: 'example/index.html',
						unknownField: 'invalid',
					},
				};
				fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(pkg, null, 2));
				fs.writeFileSync(path.join(tempDir, 'README.md'), minimalValidReadme);
				fs.mkdirSync(path.join(tempDir, 'example'));
				fs.writeFileSync(path.join(tempDir, 'example/index.html'), '<html></html>');

				const result = validatePackageMetadata(tempDir, { isOfficial: true });
				expect(result.valid).to.be.false;
				expect(result.errors.some((e: string) => e.includes('unknownField') || e.includes('additional'))).to.be.true;
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	describe('Pack Content Verification (verifyPackContent)', () => {
		it('should verify tarball containing LICENSE, NOTICE and declared entrypoints', () => {
			const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-pack-test-'));
			try {
				const stageDir = path.join(tempDir, 'package');
				fs.mkdirSync(path.join(stageDir, 'dist'), { recursive: true });

				fs.writeFileSync(path.join(stageDir, 'LICENSE'), 'License');
				fs.writeFileSync(path.join(stageDir, 'NOTICE'), 'Notice');
				fs.writeFileSync(path.join(stageDir, 'package.json'), '{}');
				fs.writeFileSync(path.join(stageDir, 'dist/entry.js'), 'export {}');
				fs.writeFileSync(path.join(stageDir, 'dist/entry.d.ts'), 'export {}');

				const tarballPath = path.join(tempDir, 'test-package.tgz');
				execFileSync('tar', ['-czf', tarballPath, 'package'], { cwd: tempDir });

				const packageJson = {
					main: './dist/entry.js',
					types: './dist/entry.d.ts',
				};

				const result = verifyPackContent(tarballPath, packageJson);
				expect(result.valid).to.be.true;
				expect(result.errors).to.be.empty;
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		});

		it('should detect missing LICENSE or missing declared entrypoints in tarball', () => {
			const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-pack-test-'));
			try {
				const stageDir = path.join(tempDir, 'package');
				fs.mkdirSync(stageDir, { recursive: true });
				fs.writeFileSync(path.join(stageDir, 'NOTICE'), 'Notice');

				const tarballPath = path.join(tempDir, 'test-package.tgz');
				execFileSync('tar', ['-czf', tarballPath, 'package'], { cwd: tempDir });

				const packageJson = {
					main: './dist/missing.js',
				};

				const result = verifyPackContent(tarballPath, packageJson);
				expect(result.valid).to.be.false;
				expect(result.errors).to.include('Tarball missing LICENSE file');
				expect(result.errors).to.include("Tarball missing declared entrypoint: 'dist/missing.js'");
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		});
	});

	describe('Stale plugin detection (compareDistDirs, classifyStaleness)', () => {
		it('should report changed, added and removed files between two dist directories', () => {
			const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-dist-diff-'));
			try {
				const local = path.join(tempDir, 'local');
				const published = path.join(tempDir, 'published');
				for (const dir of [local, published]) {
					fs.mkdirSync(path.join(dir, 'nested'), { recursive: true });
					fs.writeFileSync(path.join(dir, 'same.js'), 'export const a = 1;');
					fs.writeFileSync(path.join(dir, 'nested', 'changed.js'), dir === local ? 'new' : 'old');
				}
				fs.writeFileSync(path.join(local, 'added.d.ts'), 'export {};');
				fs.writeFileSync(path.join(published, 'removed.js'), 'gone');

				const diff = compareDistDirs(local, published);
				expect(diff.identical).to.be.false;
				expect(diff.changed).to.deep.equal(['nested/changed.js']);
				expect(diff.added).to.deep.equal(['added.d.ts']);
				expect(diff.removed).to.deep.equal(['removed.js']);

				fs.rmSync(path.join(local, 'added.d.ts'));
				fs.rmSync(path.join(published, 'removed.js'));
				fs.writeFileSync(path.join(local, 'nested', 'changed.js'), 'old');
				expect(compareDistDirs(local, published).identical).to.be.true;
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		});

		it('should treat a missing published dist as all files added', () => {
			const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-dist-diff-'));
			try {
				fs.writeFileSync(path.join(tempDir, 'entry.js'), 'x');
				const diff = compareDistDirs(tempDir, path.join(tempDir, 'does-not-exist'));
				expect(diff.identical).to.be.false;
				expect(diff.added).to.deep.equal(['entry.js']);
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		});

		it('should classify output and version changes', () => {
			expect(classifyStaleness({ outputDiffers: true, versionBumped: false }).status).to.equal('fail');
			expect(classifyStaleness({ outputDiffers: true, versionBumped: true }).status).to.equal('pass');
			expect(classifyStaleness({ outputDiffers: false, versionBumped: true }).status).to.equal('warn');
			expect(classifyStaleness({ outputDiffers: false, versionBumped: false }).status).to.equal('pass');
		});
	});
});
