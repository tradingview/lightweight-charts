import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Answers, categoryTemplates } from './questions';
import { copy } from './helpers/io';
import { readmeSnippets } from './snippets';

const renameFiles: Record<string, string | undefined> = {
	_gitignore: '.gitignore',
};

const ENTRY_PLACEHOLDER = 'template-entry';

function templatePath(name: string): string {
	return path.resolve(fileURLToPath(import.meta.url), '../..', name);
}

/** The unscoped package name without the shared prefix, e.g. `heatmap-series`. */
export function entryNameFor(packageName: string): string {
	return packageName
		.slice(packageName.indexOf('/') + 1)
		.replace(/^lwc-plugin-/, '');
}

/**
 * Builds the published manifest from the template, applying the differences
 * between a standalone community project and an in-repo workspace package.
 */
function sortedByKey(record: Record<string, string>): Record<string, string> {
	return Object.fromEntries(
		Object.entries(record).sort(([a], [b]) => a.localeCompare(b))
	);
}

function buildPackageJson(template: string, answers: Answers): string {
	const pkg = JSON.parse(template);

	// An absent field is better metadata than an empty one.
	if (!answers.author) {
		delete pkg.author;
		delete pkg.lwcPlugin.author;
	}
	if (!answers.license) delete pkg.license;
	pkg.lwcPlugin.tags = answers.tags;

	if (answers.workspace) {
		pkg.files = ['dist', 'CHANGELOG.md', 'NOTICE'];
		pkg.lwcPlugin.origin = 'official';
		pkg.devDependencies = sortedByKey({
			...pkg.devDependencies,
			'@tradingview/lwc-plugin-utils': 'workspace:*',
			'lightweight-charts': 'workspace:*',
		});
	} else {
		// The author fills this in once the project has a home of its own.
		delete pkg.repository;
	}

	return JSON.stringify(pkg, null, '\t') + '\n';
}

/**
 * Writes a new plugin project into `<baseDir>/<answers.targetFolderPath>`.
 *
 * @param answers - the answers collected by the wizard.
 * @param baseDir - directory the target path is resolved against: the current
 * directory for a standalone project, or the repository root in workspace mode.
 * @returns the absolute path of the created project.
 */
export function scaffold(answers: Answers, baseDir: string): string {
	const root = path.join(baseDir, answers.targetFolderPath);
	if (answers.targetFolderPath) {
		fs.mkdirSync(root, { recursive: true });
	}

	const templateDir = templatePath(categoryTemplates[answers.category]);
	const commonTemplateDir = templatePath('template-common');

	const entryName = entryNameFor(answers.packageName);
	const snippets = readmeSnippets[answers.category];

	/*
	 Substitutions are applied in order, and the order matters: the README
	 snippets are injected first because they themselves contain the
	 `_CLASSNAME_`, `_PACKAGENAME_` and `_ENTRYNAME_` placeholders, which the
	 later entries then resolve.

	 Each replacement is a function rather than a string so that a `$` in an
	 answer (`$&` and friends) is inserted literally instead of being treated as
	 a replacement pattern.
	 */
	const substitutions: [string, string][] = [
		[ENTRY_PLACEHOLDER, entryName],
		['_ATTACH_SNIPPET_', snippets.attach],
		['_CDN_SNIPPET_', snippets.cdnAttach],
		['_USAGE_SNIPPET_', snippets.usage],
		['_ENTRYNAME_', entryName],
		['_PLUGINNAME_', answers.name],
		['_CLASSNAME_', answers.typeName],
		['_PACKAGENAME_', answers.packageName],
		['_DESCRIPTION_', answers.description],
		['_AUTHOR_', answers.author],
		['_LICENSE_', answers.license],
		['_PEERVERSION_', answers.peerVersion],
		['_CATEGORY_', answers.category],
	];

	/** Escapes a value for use inside a JSON string literal. */
	const forJsonString = (value: string): string =>
		JSON.stringify(value).slice(1, -1);

	const makeReplacer =
		(escape: (value: string) => string) =>
		(content: string): string => {
			let result = content;
			for (const [placeholder, value] of substitutions) {
				const replacement = escape(value);
				result = result.replaceAll(placeholder, () => replacement);
			}
			if (answers.includeHints) {
				return result;
			}
			// Comments starting with '//*' are considered 'hints'
			return result.replace(/.*\/\/\*.*\r?\n/g, '');
		};

	const contentsReplacer = makeReplacer(value => value);
	// The answers land inside JSON string literals, so quotes and backslashes in
	// them have to be escaped for the manifest to stay parseable.
	const jsonContentsReplacer = makeReplacer(forJsonString);

	const write = (dir: string, file: string) => {
		const targetPath = path.join(root, renameFiles[file] ?? file);
		copy(path.join(dir, file), targetPath, contentsReplacer);
	};

	for (const file of fs.readdirSync(templateDir)) {
		write(templateDir, file);
	}

	const skipCommonFiles = new Set(['package.json']);
	if (answers.workspace) {
		// The repository already ignores build output for every package.
		skipCommonFiles.add('_gitignore');
	}
	for (const file of fs.readdirSync(commonTemplateDir)) {
		if (skipCommonFiles.has(file)) continue;
		write(commonTemplateDir, file);
	}

	if (answers.workspace) {
		// Official packages ship a changelog, licence and notice of their own.
		const workspaceTemplateDir = templatePath('template-workspace');
		for (const file of fs.readdirSync(workspaceTemplateDir)) {
			write(workspaceTemplateDir, file);
		}
	}

	const packageTemplate = jsonContentsReplacer(
		fs.readFileSync(path.join(commonTemplateDir, 'package.json'), 'utf-8')
	);
	fs.writeFileSync(
		path.join(root, 'package.json'),
		buildPackageJson(packageTemplate, answers)
	);

	fs.renameSync(
		path.join(root, 'src', `${ENTRY_PLACEHOLDER}.ts`),
		path.join(root, 'src', `${entryName}.ts`)
	);

	return root;
}
