// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import path from 'node:path';
import fs from 'node:fs/promises';

import { themes } from 'prism-react-renderer';
import pluginDocusaurus from 'docusaurus-plugin-typedoc';
import logger from '@docusaurus/logger';

import versions from './versions.json';

/* Configuration Constants */
const organizationName = process.env.GITHUB_ORGANIZATION_NAME || 'tradingview';
const projectName = 'lightweight-charts';
const projectUrl = `https://github.com/${organizationName}/${projectName}`;
const githubPagesUrl = `https://${organizationName}.github.io`;

const cacheDir = path.resolve(
	new URL('.', import.meta.url).pathname,
	'./.previous-typings-cache/'
);
const typedocWatch = process.env.TYPEDOC_WATCH === 'true';

async function ensureDirectoryExists(directory) {
	try {
		await fs.mkdir(directory, { recursive: true });
	} catch (error) {
		// Ignore the error if the directory already exists
		if (error.code !== 'EEXIST') {
			throw error;
		}
	}
}

async function downloadFile(
	urlString,
	filePath,
	retriesRemaining = 3,
	attempt = 1
) {
	try {
		// Ensure the directory exists
		const directory = path.dirname(filePath);
		await ensureDirectoryExists(directory);

		const response = await fetch(urlString, {
			redirect: 'follow', // Automatically follow redirects
			signal: AbortSignal.timeout(5000), // 5 second timeout
		});

		if (!response.ok) {
			// Handle non-2xx responses
			if (retriesRemaining > 0) {
				logger.info(
					`Failed to download from ${urlString}, attempting again (${
						retriesRemaining - 1
					} retries remaining).`
				);

				// Exponential backoff
				await new Promise(resolve =>
					setTimeout(resolve, Math.pow(2, attempt) * 200)
				);

				return downloadFile(
					urlString,
					filePath,
					retriesRemaining - 1,
					attempt + 1
				);
			}

			throw new Error(
				`Cannot download file "${urlString}", error code=${response.status}`
			);
		}

		// Get the response as an ArrayBuffer or Buffer
		const fileData = await response.arrayBuffer();

		// Write the file asynchronously
		await fs.writeFile(filePath, Buffer.from(fileData));
	} catch (error) {
		// Handle fetch errors (network issues, timeouts, etc.)
		if (error.name === 'AbortError') {
			if (retriesRemaining > 0) {
				logger.info(
					`Request timed out for ${urlString}, attempting again (${
						retriesRemaining - 1
					} retries remaining).`
				);

				return downloadFile(
					urlString,
					filePath,
					retriesRemaining - 1,
					attempt + 1
				);
			}
		}

		throw error;
	}
}

/**
 * @param {string} typingsFilePath
 * @param {any} version
 */
function downloadTypingsToFile(typingsFilePath, version) {
	return downloadFile(
		`https://unpkg.com/lightweight-charts@${version}/dist/typings.d.ts`,
		typingsFilePath,
		2
	);
}

/**
 * @param {any} version
 */
function getTypingsCacheFilePath(version) {
	return path.resolve(cacheDir, `./v${version}.d.ts`);
}

/**
 * @param {any} version
 */
async function downloadTypingsFromUnpkg(version) {
	const typingsFilePath = getTypingsCacheFilePath(version);

	try {
		await fs.stat(typingsFilePath);
	} catch (e) {
		if (e.code !== 'ENOENT') {
			throw e;
		}

		await downloadTypingsToFile(typingsFilePath, version);
	}

	return typingsFilePath;
}

// PluginOptions
/** @type {Partial<import('docusaurus-plugin-typedoc/dist/models').PluginOptions> & Partial<import('typedoc').TypeDocOptions> & Partial<import('typedoc-plugin-frontmatter/dist/options/models').PluginOptions>} */
const commonDocusaurusPluginTypedocConfig = {
	readme: 'none',
	disableSources: true,
	tsconfig: path.resolve(cacheDir, './tsconfig.json'),
	publicPath: '/api/',
	name: 'lightweight-charts',
	sort: ['source-order'],
	plugin: ['typedoc-plugin-frontmatter'],
	frontmatterGlobals: {
		/* eslint-disable camelcase */
		// @ts-ignore
		pagination_next: null,
		// @ts-ignore
		pagination_prev: null,
		/* eslint-enable camelcase */
	},
};

/**
 * @param {any} version
 */
function typedocPluginForVersion(version) {
	return (/** @type {any} */ context) => ({
		name: `typedoc-for-v${version}`,
		loadContent: async () => {
			await pluginDocusaurus(context, {
				...commonDocusaurusPluginTypedocConfig,
				id: `${version}-api`,
				// @ts-ignore
				entryPoints: [getTypingsCacheFilePath(version)],
				out: path.resolve(
					new URL('.', import.meta.url).pathname,
					`./versioned_docs/version-${version}/api`
				),
			});
		},
	});
}

const getConfig = async () => {
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

		future: {
			// @ts-ignore experimental property name
			// eslint-disable-next-line camelcase
			experimental_faster: true,
		},

		headTags: [
			{
				tagName: 'link',
				attributes: {
					rel: 'apple-touch-icon',
					sizes: '180x180',
					href: `/${projectName}/img/favicon/apple-touch-icon.png`,
				},
			},
			{
				tagName: 'link',
				attributes: {
					rel: 'icon',
					type: 'image/png',
					sizes: '32x32',
					href: `/${projectName}/img/favicon/32x32.png`,
				},
			},
			{
				tagName: 'link',
				attributes: {
					rel: 'icon',
					type: 'image/png',
					sizes: '16x16',
					href: `/${projectName}/img/favicon/16x16.png`,
				},
			},
			{
				tagName: 'link',
				attributes: {
					rel: 'mask-icon',
					color: '#2962ff',
					href: `/${projectName}/img/favicon/safari-pinned-tab.svg`,
				},
			},
			{
				tagName: 'link',
				attributes: {
					rel: 'icon',
					type: 'image/svg',
					sizes: '32x32',
					href: `/${projectName}/img/favicon/favicon.svg`,
				},
			},
		],

		presets: [
			[
				'@docusaurus/preset-classic',
				{
					blog: false,
					docs: {
						sidebarPath: new URL('./sidebars.js', import.meta.url).pathname,
					},
					theme: {
						customCss: new URL('./src/css/custom.css', import.meta.url)
							.pathname,
					},
				},
			],
		],

		customFields: {},

		themeConfig: {
			navbar: {
				title: 'Lightweight Charts',
				logo: {
					src: 'this value is not used because we swizzled the Logo component - see src/theme/Logo',
					alt: 'Lightweight Charts home button',
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
						title: 'Lightweight Charts™ Community',
						items: [
							{
								label: 'Stack Overflow',
								href: 'https://stackoverflow.com/questions/tagged/lightweight-charts',
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
								label: 'Advanced Charts',
								href: 'https://www.tradingview.com/charting-library-docs/',
							},
							{
								label: 'TradingView Widgets',
								href: 'https://www.tradingview.com/widget/',
							},
						],
					},
				],
				copyright: `Copyright © ${new Date().getFullYear()} TradingView, Inc. Built with Docusaurus.`,
			},
			prism: {
				theme: themes.github,
				darkTheme: themes.dracula,
				additionalLanguages: ['ruby', 'swift', 'kotlin', 'groovy'],
				magicComments: [
					{
						className: 'theme-code-block-highlighted-line',
						line: 'highlight-next-line',
						block: { start: 'highlight-start', end: 'highlight-end' },
					},
					{
						className: 'code-block-fade-line',
						block: {
							start: 'highlight-fade-start',
							end: 'highlight-fade-end',
						},
						line: 'highlight-fade',
					},
					{
						className: 'code-block-hide-line',
						block: { start: 'hide-start', end: 'hide-end' },
						line: 'hide-line',
					},
					{
						className: 'code-block-remove-line',
						block: { start: 'remove-start', end: 'remove-end' },
						line: 'remove-line',
					},
				],
			},
			algolia: {
				appId: '7Q5A441YPA',
				apiKey: 'c8a8aaeb7ef3fbcce40bada2196e2bcb',
				indexName: 'lightweight-charts',
				contextualSearch: true,
			},
		},

		plugins: [
			[
				'content-docs',
				{
					id: 'tutorials',
					path: 'tutorials',
					routeBasePath: 'tutorials',
					sidebarPath: new URL('./sidebars-tutorials.js', import.meta.url)
						.pathname,
				},
			],
			[
				'docusaurus-plugin-typedoc',
				{
					...commonDocusaurusPluginTypedocConfig,
					id: 'current-api',
					entryPoints: ['../dist/typings.d.ts'],
					watch: typedocWatch,
					preserveWatchOutput: typedocWatch,
				},
			],
			...versions.map(typedocPluginForVersion),
			'./plugins/enhanced-codeblock',
			'./plugins/suppress-resize-observer-error',
		],
	};

	return config;
};

// eslint-disable-next-line import/no-default-export
export default getConfig();
