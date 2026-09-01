import { confirm, select, isCancel, text, log } from '@clack/prompts';
import { isValidPackageName, toValidPackageName } from './helpers/validation';
import color from 'picocolors';
import { dirExists, isEmpty } from './helpers/io';
import { resolve } from 'node:path';
import { latestLibraryVersion } from './helpers/lwc-version';

export type PluginCategory =
	| 'custom-series'
	| 'series-primitive'
	| 'pane-primitive';

const CATEGORIES: PluginCategory[] = [
	'custom-series',
	'series-primitive',
	'pane-primitive',
];

/** Template folder used to scaffold each category of plugin. */
export const categoryTemplates: Record<PluginCategory, string> = {
	'custom-series': 'template-series',
	'series-primitive': 'template-series-primitive',
	'pane-primitive': 'template-pane-primitive',
};

const WORKSPACE_SCOPE = '@tradingview/';
const WORKSPACE_LICENSE = 'Apache-2.0';
const WORKSPACE_AUTHOR = 'TradingView, Inc.';

export interface Answers {
	category: PluginCategory;
	name: string;
	packageName: string;
	typeName: string;
	description: string;
	author: string;
	/** SPDX identifier, or an empty string to leave the field out. */
	license: string;
	/** Semver range for the `lightweight-charts` peer dependency. */
	peerVersion: string;
	tags: string[];
	targetFolderPath: string;
	includeHints: boolean;
	workspace: boolean;
}

/**
 * @param workspace - whether an in-repo workspace package is being scaffolded.
 * @param baseDir - directory the target folder path is resolved against. Must be
 * the same base the project is written to, or the "folder is not empty" check
 * would guard a different directory than the one written to.
 */
export async function askQuestions(
	workspace: boolean,
	baseDir: string
): Promise<Answers> {
	if (workspace) {
		log.info(
			`Scaffolding an ${color.bold(
				'in-repo workspace package'
			)}: ${WORKSPACE_SCOPE} scope, ${WORKSPACE_LICENSE} licence, workspace dependencies.`
		);
	}

	let category: string | symbol = '';
	while (CATEGORIES.includes(category as PluginCategory) === false) {
		const options = [
			{ value: 'series-primitive', label: 'Series Primitive' },
			{ value: 'pane-primitive', label: 'Pane Primitive' },
			{ value: 'custom-series', label: 'Custom Series' },
		];
		if (category !== 'help') {
			options.push({ value: 'help', label: 'Help me decide' });
		}
		category = await select({
			message: 'Pick a plugin type.',
			options,
		});
		if (isCancel(category)) throw new Error('Operation cancelled');
		if (category === 'help') {
			log.message(`Plugins come in three types: primitives and custom series.
A Series Primitive is attached to a series, and can draw anywhere on
the chart as well as on the price and time scales. Use it for custom
visualisations, drawing tools and annotations which relate to the data
of a particular series.
A Pane Primitive is attached to a pane instead of to a series, so it
suits pane-level decoration: titles, badges, legends and watermarks.
A Custom Series defines an entirely new type of series, drawing the
data points of the series itself.`);
			log.info(`In the majority of cases you will most likely be better served
by a primitive, unless you are specifically looking to create a new
type of series.`);
		}
	}

	const name = await text({
		message: `What would you like to name the plugin?`,
		placeholder:
			category === 'custom-series' ? 'My Custom Series' : 'My Primitive',
		validate(value) {
			if (value.length === 0) return 'A name is required!';
		},
	});
	if (isCancel(name)) throw new Error('Operation cancelled');

	const description = await text({
		message: 'Describe the plugin in a sentence.',
		placeholder: 'Shown on npm and on the plugin registry card.',
		validate(value) {
			if (value.length === 0) return 'A description is required!';
		},
	});
	if (isCancel(description)) throw new Error('Operation cancelled');

	const unscopedName = toValidPackageName('lwc-plugin-' + name);
	const suggestedPackageName = workspace
		? WORKSPACE_SCOPE + unscopedName
		: unscopedName;
	const packageName = await text({
		message: 'Package Name for the Plugin?',
		placeholder: suggestedPackageName,
		initialValue: suggestedPackageName,
		validate(value) {
			if (value.length === 0) return 'A package name is required!';
			if (workspace && !value.startsWith(WORKSPACE_SCOPE))
				return `A workspace package name should start with \`${WORKSPACE_SCOPE}\``;
			const unscoped = value.slice(value.indexOf('/') + 1);
			if (!unscoped.startsWith('lwc-plugin-'))
				return 'A package name should start with `lwc-plugin-`';
			if (!isValidPackageName(value))
				return 'The name is not a valid npm package name!';
		},
	});
	if (isCancel(packageName)) throw new Error('Operation cancelled');

	let suggestedTypeName = name.replace(/[^a-zA-Z0-9]/g, '');
	suggestedTypeName =
		suggestedTypeName[0].toUpperCase() + suggestedTypeName.slice(1);

	const typeName = await text({
		message: 'Class Name for the Plugin?',
		placeholder: suggestedTypeName,
		initialValue: suggestedTypeName,
		validate(value) {
			if (value.length === 0) return 'A class name is required!';
			if (/\s/.test(value)) return 'A class name may not contain any spaces!';
			if (/\-/.test(value)) return 'A class name may not contain any hyphens!';
			if (/^\d/.test(value)) return 'A class name may not start with a digit!';
			if (/^[a-zA-Z0-9]+$/.test(value) === false)
				return 'A class name may only contain letters and numbers!';
			if (/^[a-z]/.test(value))
				return 'A class name should start with a capital letter!';
		},
	});
	if (isCancel(typeName)) throw new Error('Operation cancelled');

	let author = WORKSPACE_AUTHOR;
	if (!workspace) {
		const authorAnswer = await text({
			message: `Plugin author? ${color.dim('(leave blank to skip)')}`,
			placeholder: 'Your name',
			defaultValue: '',
		});
		if (isCancel(authorAnswer)) throw new Error('Operation cancelled');
		author = authorAnswer;
	}

	let license = WORKSPACE_LICENSE;
	if (!workspace) {
		const licenseAnswer = await select({
			message: 'Which licence should the plugin be published under?',
			options: [
				{ value: 'MIT', label: 'MIT' },
				{ value: 'Apache-2.0', label: 'Apache-2.0' },
				{ value: 'ISC', label: 'ISC' },
				{ value: '', label: `None ${color.dim('(leave the field blank)')}` },
			],
		});
		if (isCancel(licenseAnswer)) throw new Error('Operation cancelled');
		license = licenseAnswer as string;
	}

	const latestVersion = await latestLibraryVersion();
	const minimumVersion = await text({
		message: `Minimum supported Lightweight Charts version? ${color.dim(
			'(published as a caret range)'
		)}`,
		placeholder: latestVersion,
		initialValue: latestVersion,
		validate(value) {
			if (value.length === 0) return 'A version is required!';
			if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(value))
				return 'Enter a version number such as ' + latestVersion;
		},
	});
	if (isCancel(minimumVersion)) throw new Error('Operation cancelled');
	const peerVersion = `^${minimumVersion}`;

	const tagsAnswer = await text({
		message: `Tags for the plugin registry? ${color.dim(
			'(comma separated, leave blank to skip)'
		)}`,
		placeholder: 'volume, liquidity',
		defaultValue: '',
	});
	if (isCancel(tagsAnswer)) throw new Error('Operation cancelled');
	const tags = tagsAnswer
		.split(',')
		.map(tag => tag.trim())
		.filter(tag => tag.length > 0);

	const includeHints = await confirm({
		message: 'Include hint comments?',
	});
	if (isCancel(includeHints)) throw new Error('Operation cancelled');

	const defaultFolderPath = workspace
		? `packages/${unscopedName}`
		: unscopedName;
	const targetFolderPath = await text({
		message: workspace
			? `Folder path for the created package? ${color.dim(
					'(relative to the repository root)'
			  )}`
			: `Relative Folder Path for Created Plugin? ${color.dim(
					'(leave blank to use current directory)'
			  )}`,
		placeholder: defaultFolderPath,
		initialValue: defaultFolderPath,
		validate(value) {
			if (workspace && value.length === 0)
				return 'A folder path is required for a workspace package!';
			const path = resolve(baseDir, value);
			if (value && dirExists(path) && !isEmpty(path))
				return 'folder already exists, and it is not empty!';
			if (!value && !isEmpty(path)) return 'current directory is not empty!';
		},
	});
	if (isCancel(targetFolderPath)) throw new Error('Operation cancelled');

	const shouldContinue = await confirm({
		message: `Scaffold a new plugin project into the ${color.bold(
			targetFolderPath || 'current'
		)} folder?`,
		active: 'Start',
		inactive: 'Cancel',
	});
	if (isCancel(shouldContinue) || !shouldContinue)
		throw new Error('Operation cancelled');
	return {
		category: category as PluginCategory,
		name,
		packageName,
		typeName,
		description,
		author,
		license,
		peerVersion,
		tags,
		targetFolderPath,
		includeHints,
		workspace,
	};
}
