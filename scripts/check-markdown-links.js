#!/usr/bin/env node

/**
 * This script checks that all local links in markdown files are valid (include anchors)
 */

const fs = require('fs');
const path = require('path');

const glob = require('glob');
const markdown = require('markdown-it');
const markdownAnchors = require('markdown-it-anchor');

const versions = require('../website/versions.json');

const websiteRoot = normalizePath(path.join(__dirname, '../website/'));

const websiteDocsFolders = [
	normalizePath(path.join(websiteRoot, '/docs/')),
	...versions.map(version => normalizePath(path.join(websiteRoot, `/versioned_docs/version-${version}/`))),
	websiteRoot,
];

function isOutOfFolder(filePath, folderPath) {
	const relativePath = normalizePath(path.relative(folderPath, filePath));
	return relativePath.startsWith('../');
}

function docsRootForPath(filePath) {
	filePath = path.resolve(filePath);

	for (const websiteDocsFolder of websiteDocsFolders) {
		if (!isOutOfFolder(filePath, websiteDocsFolder)) {
			return websiteDocsFolder;
		}
	}

	return null;
}

function isFromWebsiteFolder(filePath) {
	return docsRootForPath(filePath) !== null;
}

function extractLinks(filePath, tokens, parentLineNumber) {
	const result = [];
	for (const token of tokens) {
		const tokenLineNumber = token.map === null ? parentLineNumber : (token.map[0] + 1);
		if (token.type !== 'link_open') {
			if (token.children === null) {
				continue;
			}

			result.push(...extractLinks(filePath, token.children, tokenLineNumber));
			continue;
		}

		const linkHref = token.attrGet('href');
		if (linkHref === null) {
			throw new Error('Something went wrong - open link does not have href attr');
		}

		const [urlPrefix, anchor] = linkHref.split('#');
		if (/^https?:\/\//.test(urlPrefix)) {
			continue;
		}

		let linkToFilePath;

		// if a link is inside website docs then we should treat links started from `/` a bit differently
		const docsRoot = docsRootForPath(filePath);
		if (urlPrefix.startsWith('/') && docsRoot !== null) {
			linkToFilePath = path.join(docsRoot, urlPrefix);
		} else {
			linkToFilePath = urlPrefix.length === 0 ? filePath : path.join(filePath, '..', urlPrefix);
		}

		const markdownLink = {
			filePath: normalizePath(linkToFilePath),
			lineNumber: tokenLineNumber,
		};

		if (anchor !== undefined) {
			markdownLink.anchor = anchor.toLowerCase();
		}

		result.push(markdownLink);
	}

	return result;
}

function extractDefinedHeaders(tokens) {
	const result = new Set();
	for (const token of tokens) {
		if (token.type !== 'heading_open') {
			continue;
		}

		const id = token.attrGet('id');
		if (id === null) {
			continue;
		}

		result.add(id.toLowerCase());
	}

	return result;
}

function normalizePath(filePath) {
	return path.normalize(filePath).replace(/\\/g, '/');
}

function collectFilesData(inputFiles, checkWebsiteLinks) {
	const md = markdown({ html: true })
		.use(
			markdownAnchors,
			{
				slugify: value => {
					const result = value
						.replace(/[^\w\s-]/g, '')
						.toLowerCase()
						.trim()
						.replace(/[\s]+/g, '-')
						.replace(/([A-Z])/g, '-$1')
						.replace(/-+/g, '-');

					if (result.charAt(0) === '-') {
						return result.slice(1);
					}

					return result;
				},
			}
		);

	const filesQueue = inputFiles.slice();

	const result = new Map();
	for (let i = 0; i < filesQueue.length; ++i) {
		const filePath = normalizePath(filesQueue[i]);
		if (result.has(filePath)) {
			continue;
		}

		if (path.extname(filePath) !== '.md') {
			continue;
		}

		if (!checkWebsiteLinks && isFromWebsiteFolder(filePath)) {
			continue;
		}

		if (!fs.existsSync(filePath)) {
			throw new Error(`File or directory "${filePath}" doesn't exist`);
		}

		const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
		const fileTokens = md.parse(fileContent, {});

		const requestedLinks = extractLinks(filePath, fileTokens);
		result.set(filePath, {
			definedHeaders: extractDefinedHeaders(fileTokens),
			requestedLinks: requestedLinks,
		});

		filesQueue.push(...requestedLinks.map(link => link.filePath));
	}

	return result;
}

function generateErrors(filesData) {
	const result = new Map();
	filesData.forEach((data, filePath) => {
		for (const link of data.requestedLinks) {
			const requestedLinkData = filesData.get(link.filePath);
			if (requestedLinkData === undefined) {
				// it's ok - this might be a link to folder/non-markdown file
				continue;
			}

			if (link.anchor === undefined) {
				// it is ok - just referenced to the whole file
				continue;
			}

			if (!requestedLinkData.definedHeaders.has(link.anchor)) {
				let fileErrors = result.get(filePath);
				if (fileErrors === undefined) {
					fileErrors = [];
					result.set(filePath, fileErrors);
				}

				fileErrors.push({
					lineNumber: link.lineNumber,
					linkInfo: link,
				});
			}
		}
	});

	return result;
}

function main() {
	const checkWebsiteLinks = process.argv.includes('--check-website-links');

	const files = glob.sync('**/*.md', {
		dot: true,
		nodir: true,
		ignore: [
			'**/node_modules/**',
			'**/docs/api/**',
		],
	});

	let filesData;
	try {
		filesData = collectFilesData(files, checkWebsiteLinks);
	} catch (e) {
		console.error(e.stack || e.message);
		process.exitCode = 1;
		return;
	}

	const errorsByFile = generateErrors(filesData);

	const filesWithErrors = Array.from(errorsByFile.keys()).sort();
	if (filesWithErrors.length !== 0) {
		for (const filePath of filesWithErrors) {
			const fileErrors = errorsByFile.get(filePath).map(errorInfo => {
				const errorFilePrefix = filePath + (errorInfo.lineNumber === undefined ? '' : `:${errorInfo.lineNumber}`);
				const linkFullPath = errorInfo.linkInfo.filePath + (errorInfo.linkInfo.anchor === undefined ? '' : `#${errorInfo.linkInfo.anchor}`);
				return `${errorFilePrefix} - cannot find ${linkFullPath}`;
			});

			console.error(fileErrors.join('\n'));
		}

		process.exitCode = 1;
	}
}

if (require.main === module) {
	main();
}
