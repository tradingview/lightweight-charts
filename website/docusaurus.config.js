// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const https = require('https');

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const { default: pluginDocusaurus } = require('docusaurus-plugin-typedoc');
const logger = require('@docusaurus/logger');

const versions = require('./versions.json');
const sizeLimits = require('../.size-limit');

const organizationName = process.env.GITHUB_ORGANIZATION_NAME || 'tradingview';
const projectName = 'lightweight-charts';
const projectUrl = `https://github.com/${organizationName}/${projectName}`;
const githubPagesUrl = `https://${organizationName}.github.io`;

const cacheDir = path.resolve(__dirname, './.previous-typings-cache/');

const typedocWatch = process.env.TYPEDOC_WATCH === 'true';

function httpGetJson(url) {
	return new Promise((resolve, reject) => {
		const request = https.get(url, response => {
			if (response.statusCode && (response.statusCode < 100 || response.statusCode > 299)) {
				reject(new Error(`Cannot load "${url}", error code=${response.statusCode}`));
				return;
			}

			let data = '';

			response.on('data', d => {
				data += d;
			});

			response.on('end', () => {
				resolve(JSON.parse(data));
			});
		});

		request.on('error', error => {
			reject(error);
		});
	});
}

function downloadFile(urlString, filePath) {
	return new Promise((resolve, reject) => {
		let file;

		const url = new URL(urlString);

		const request = https.get(url, response => {
			if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location !== undefined) {
				// handling redirect
				url.pathname = response.headers.location;
				downloadFile(url.toString(), filePath).then(resolve, reject);
				return;
			}

			if (response.statusCode && (response.statusCode < 100 || response.statusCode > 299)) {
				reject(new Error(`Cannot download file "${urlString}", error code=${response.statusCode}`));
				return;
			}

			file = fs.createWriteStream(filePath);
			file.on('finish', () => {
				file.close(resolve);
			});

			response.pipe(file);
		});

		request.on('error', error => {
			if (file !== undefined) {
				file.close();
			}

			reject(error);
		});
	});
}

function downloadTypingsToFile(typingsFilePath, version) {
	return downloadFile(
		`https://unpkg.com/lightweight-charts@${version}/dist/typings.d.ts`,
		typingsFilePath
	);
}

function getTypingsCacheFilePath(version) {
	return path.resolve(cacheDir, `./v${version}.d.ts`);
}

async function downloadTypingsFromUnpkg(version) {
	const typingsFilePath = getTypingsCacheFilePath(version);

	try {
		await fsp.stat(typingsFilePath);
	} catch (e) {
		if (e.code !== 'ENOENT') {
			throw e;
		}

		await downloadTypingsToFile(typingsFilePath, version);
	}

	return typingsFilePath;
}

/** @type {Partial<import('docusaurus-plugin-typedoc/dist/types').PluginOptions> & import('typedoc').TypeDocOptions} */
const commonDocusaurusPluginTypedocConfig = {
	readme: 'none',
	disableSources: true,
	tsconfig: path.resolve(cacheDir, './tsconfig.json'),
	// The trailing slash is required.
	// @ts-ignore
	publicPath: '/api/',
	// This needs to be here because TypeDoc fails to auto-detect the project name
	// which would result in the title of our generated index page being 'undefined'.
	name: 'lightweight-charts',
	sort: ['source-order'],

	// let's disable pagination for API Reference pages since it makes almost no sense there
	frontmatter: {
		// eslint-disable-next-line camelcase
		pagination_next: null,
		// eslint-disable-next-line camelcase
		pagination_prev: null,
	},
};

/** @type {(version: string) => import('@docusaurus/types').PluginModule} */
function typedocPluginForVersion(version) {
	return context => ({
		name: `typedoc-for-v${version}`,

		/** @type {() => Promise<any>} */
		loadContent: async () => {
			await pluginDocusaurus(context, {
				...commonDocusaurusPluginTypedocConfig,
				id: `${version}-api`,
				entryPoints: [getTypingsCacheFilePath(version)],
				docsRoot: path.resolve(__dirname, `./versioned_docs/version-${version}`),
			}).loadContent();
		},
	});
}

async function getConfig() {
	let size = sizeLimits
		.map(limit => parseFloat(limit.limit.split(' ')[0]))
		.reduce((a, b) => Math.max(a, b));

	try {
		// TODO: cache the result to avoid requesting the size every time on config change
		// load the latest version every time
		const bhResult = await httpGetJson(`https://bundlephobia.com/api/size?package=lightweight-charts@${versions[0] || 'latest'}&record=true`);

		logger.info(`The bundlephobia result has been loaded: version=${bhResult.version}, gzip=${bhResult.gzip}`);
		size = bhResult.gzip / 1024;
	} catch (e) {
		logger.warn(`Cannot use size from bundlephobia, use size from size-limit instead, error=${e.toString()}`);
	}

	// pre-download required typings files before run docusaurus
	await Promise.all(versions.map(downloadTypingsFromUnpkg));

	/** @type {import('@docusaurus/types').Config} */
	const config = {
		title: 'Lightweight Charts',
		tagline: 'Small and fast financial charts',
		onBrokenLinks: 'throw',
		onBrokenMarkdownLinks: 'warn',
		favicon: '/favicon.ico',
		url: githubPagesUrl,
		baseUrl: `/${projectName}/`,
		organizationName,
		projectName: 'lightweight-charts',
		trailingSlash: false,

		presets: [
			[
				'@docusaurus/preset-classic',
				/** @type {import('@docusaurus/preset-classic').Options} */
				({
					blog: false,
					docs: {
						sidebarPath: require.resolve('./sidebars.js'),
					},
					theme: {
						customCss: require.resolve('./src/css/custom.css'),
					},
				}),
			],
		],

		customFields: {
			bundleSize: size.toFixed(0),
		},

		themeConfig:
			/** @type {import('@docusaurus/preset-classic').ThemeConfig} */
			({
				navbar: {
					title: 'Lightweight Charts',
					logo: {
						src: 'this value is not used because we swizzled the Logo component - see src/theme/Logo',
					},
					items: [
						{
							type: 'doc',
							docId: 'intro',
							position: 'left',
							label: 'Getting Started',
						},
						{
							to: '/tutorials',
							position: 'left',
							label: 'Tutorials',
						},
						{
							type: 'doc',
							docId: 'api/index',
							position: 'left',
							label: 'API Reference',
						},
						{
							type: 'docsVersionDropdown',
							position: 'right',
							dropdownActiveClassDisabled: true,
							dropdownItemsAfter: [
								{
									href: 'https://github.com/tradingview/lightweight-charts/tree/v3.7.0/docs',
									label: '3.7.0',
								},
							],
						},
						{
							href: projectUrl,
							label: 'GitHub',
							position: 'right',
						},
					],
				},
				footer: {
					links: [
						{
							title: 'Docs',
							items: [
								{
									label: 'Getting Started',
									to: '/docs',
								},
								{
									label: 'Tutorials',
									to: '/tutorials',
								},
								{
									label: 'API Reference',
									to: '/docs/api',
								},
							],
						},
						{
							title: 'Lightweight Charts Community',
							items: [
								{
									label: 'Stack Overflow',
									href: 'https://stackoverflow.com/questions/tagged/lightweight-charts',
								},
								{
									label: 'Discord',
									href: 'https://discord.gg/UC7cGkvn4U',
								},
								{
									label: 'Twitter',
									href: 'https://twitter.com/tradingview',
								},
							],
						},
						{
							title: 'More',
							items: [
								{
									label: 'GitHub',
									href: projectUrl,
								},
							],
						},
					],
					copyright: `Copyright © ${new Date().getFullYear()} TradingView, Inc. Built with Docusaurus.`,
				},
				prism: {
					theme: lightCodeTheme,
					darkTheme: darkCodeTheme,
					additionalLanguages: ['ruby', 'swift', 'kotlin', 'groovy'],
					magicComments: [
						{
							className: 'theme-code-block-highlighted-line',
							line: 'highlight-next-line',
							block: { start: 'highlight-start', end: 'highlight-end' },
						},
						{
							// Lightly fades the code lines (useful for boilerplate sections of code)
							className: 'code-block-fade-line',
							block: { start: 'highlight-fade-start', end: 'highlight-fade-end' },
							line: 'highlight-fade',
						},
						{
							// Hides code lines but can be reveal using toggle and css
							className: 'code-block-hide-line',
							block: { start: 'hide-start', end: 'hide-end' },
							line: 'hide-line',
						},
						{
							// Hides code lines and can't be reveal using toggle and css.
							// Will still be included in copied code.
							// Useful for type comments and header notices.
							className: 'code-block-remove-line',
							block: { start: 'remove-start', end: 'remove-end' },
							line: 'remove-line',
						},
					],
				},
				algolia: {
					appId: '7Q5A441YPA',
					// Public API key: it is safe to commit it
					apiKey: 'c8a8aaeb7ef3fbcce40bada2196e2bcb',
					indexName: 'lightweight-charts',
					contextualSearch: true,
				},
			}),

		plugins: [
			[
				'content-docs',
				/** @type {import('@docusaurus/plugin-content-docs').Options} */
				({
					id: 'tutorials',
					path: 'tutorials',
					routeBasePath: 'tutorials',
					sidebarPath: require.resolve('./sidebars-tutorials.js'),
				}),
			],
			[
				'docusaurus-plugin-typedoc',
				/** @type {Partial<import('docusaurus-plugin-typedoc/dist/types').PluginOptions> & import('typedoc').TypeDocOptions} */
				({
					...commonDocusaurusPluginTypedocConfig,
					id: 'current-api',
					entryPoints: ['../dist/typings.d.ts'],
					watch: typedocWatch,
					preserveWatchOutput: typedocWatch,
				}),
			],
			...versions.map(typedocPluginForVersion),
			'./plugins/enhanced-codeblock',
		],
	};

	return config;
}

module.exports = getConfig();
