// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const https = require('https');

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const { default: pluginDocusaurus } = require('docusaurus-plugin-typedoc');

const versions = require('./versions.json');

const organizationName = process.env.GITHUB_ORGANIZATION_NAME || 'tradingview';
const projectName = 'lightweight-charts';
const projectUrl = `https://github.com/${organizationName}/${projectName}`;
const githubPagesUrl = `https://${organizationName}.github.io`;

const cacheDir = path.resolve(__dirname, './.previous-typings-cache/');

const typedocWatch = process.env.TYPEDOC_WATCH === 'true';

function downloadTypingsToFile(typingsFilePath, version) {
	return new Promise((resolve, reject) => {
		let file;
		const versionTypingsUrl = `https://unpkg.com/lightweight-charts@${version}/dist/typings.d.ts`;
		const request = https.get(versionTypingsUrl, response => {
			if (response.statusCode && (response.statusCode < 100 || response.statusCode > 299)) {
				reject(new Error(`Cannot download typings "${versionTypingsUrl}", error code=${response.statusCode}`));
				return;
			}

			file = fs.createWriteStream(typingsFilePath);
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

async function downloadTypingsFromUnpkg(version) {
	const typingsFilePath = path.resolve(cacheDir, `./v${version}.d.ts`);

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

/** @type {Partial<import('docusaurus-plugin-typedoc/dist/types').PluginOptions> & import('typedoc/dist/index').TypeDocOptions} */
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
};

/** @type {(version: string) => import('@docusaurus/types').PluginModule} */
function typedocPluginForVersion(version) {
	return context => ({
		name: `typedoc-for-v${version}`,

		/** @type {() => Promise<any>} */
		loadContent: async () => {
			const typingsFilePath = await downloadTypingsFromUnpkg(version);

			await pluginDocusaurus(context, {
				...commonDocusaurusPluginTypedocConfig,
				id: `${version}-api`,
				entryPoints: [typingsFilePath],
				docsRoot: path.resolve(__dirname, `./versioned_docs/version-${version}`),
			}).loadContent();
		},
	});
}

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
								label: 'API Reference',
								to: '/docs/api',
							},
						],
					},
					{
						title: 'Community',
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
			},
			algolia: {
				appId: '7Q5A441YPA',
				// Public API key: it is safe to commit it
				apiKey: 'b6417716804e66012544fd5904e208c8',
				indexName: 'lightweight-charts',
				contextualSearch: true,
			},
		}),

	plugins: [
		[
			'docusaurus-plugin-typedoc',
			// @ts-ignore
			/** @type {Partial<import('docusaurus-plugin-typedoc/dist/types').PluginOptions> & import('typedoc/dist/index').TypeDocOptions} */
			({
				...commonDocusaurusPluginTypedocConfig,
				id: 'current-api',
				entryPoints: ['../dist/typings.d.ts'],
				watch: typedocWatch,
				preserveWatchOutput: typedocWatch,
			}),
		],
		...versions.map(typedocPluginForVersion),
	],
};

module.exports = config;
