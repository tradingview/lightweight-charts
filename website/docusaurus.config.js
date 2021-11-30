// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const path = require('path');

const versions = require('./versions.json');

const organizationName = process.env.GITHUB_ORGANIZATION_NAME || 'tradingview';
const projectName = 'lightweight-charts';
const projectUrl = `https://github.com/${organizationName}/${projectName}`;
const githubPagesUrl = `https://${organizationName}.github.io/`;

const latestVersion = versions[0];

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
					versions: {
						'3.7.0': {
							path: '3.7.0',
						},
					},
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
					alt: 'Lightweight Charts Logo',
					src: 'https://github.com/tradingview/lightweight-charts/raw/master/.github/logo.svg?sanitize=true',
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
					},
					{
						href: projectUrl,
						label: 'GitHub',
						position: 'right',
					},
				],
			},
			footer: {
				style: 'dark',
				links: [
					{
						title: 'Docs',
						items: [
							{
								label: 'Getting Started',
								to: `/docs/${latestVersion}`,
							},
							{
								label: 'API Reference',
								to: `/docs/${latestVersion}/api`,
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
								href: 'https://discord.gg/E6UthXZ',
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
				id: 'current-api',
				entryPoints: ['../dist/typings.d.ts'],
				publicPath: '/api/',
				readme: 'none',
				disableSources: true,
				watch: true,
				preserveWatchOutput: true,
				sort: ['source-order'],
			}),
		],
		[
			'docusaurus-plugin-typedoc',
			// @ts-ignore
			/** @type {Partial<import('docusaurus-plugin-typedoc/dist/types').PluginOptions> & import('typedoc/dist/index').TypeDocOptions} */
			({
				id: '3.7.0-api',
				entryPoints: ['./.cache/typings-3.7.0.d.ts'],
				tsconfig: './.cache/tsconfig-3.7.0.json',
				readme: 'none',
				disableSources: true,
				// Trailing slash required!
				publicPath: '/api/',
				docsRoot: path.resolve(__dirname, './versioned_docs/version-3.7.0'),
				// This needs to be here because TypeDoc fails to auto-detect the project name
				name: 'lightweight-charts',
			}),
		],
	],
};

module.exports = config;
