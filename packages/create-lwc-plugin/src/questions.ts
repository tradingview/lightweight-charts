import { confirm, select, isCancel, text, log } from '@clack/prompts';
import { isValidPackageName, toValidPackageName } from './helpers/validation';
import color from 'picocolors';
import { dirExists, isEmpty } from './helpers/io';
import { resolve } from 'node:path';

export interface Answers {
	projectType: 'series' | 'primitive';
	name: string;
	packageName: string;
	typeName: string;
	targetFolderPath: string;
	includeHints: boolean;
}

export async function askQuestions(): Promise<Answers> {
	let projectType: string | symbol = '';
	while (['primitive', 'series'].includes(projectType) === false) {
		const options = [
			{ value: 'primitive', label: 'Drawing Primitive' },
			{ value: 'series', label: 'Custom Series' },
		];
		if (projectType !== 'help') {
			options.push({ value: 'help', label: 'Help me decide' });
		}
		projectType = await select({
			message: 'Pick a plugin type.',
			options,
		});
		if (isCancel(projectType)) throw new Error('Operation cancelled');
		if (projectType === 'help') {
			log.message(`Plugins come in two types: custom series and drawing primitives.
Custom series allow developers to define new types of series,
while drawing primitives enable the creation of custom visualizations,
drawing tools, and chart annotations (and more) which can be attached
to an existing series.`);
			log.info(`In the majority of cases you will most likely be better served
by using a Drawing Primitive plugin unless you are specifically
looking to create a new type of series.`);
		}
	}

	const name = await text({
		message: `What would you like to name the plugin?`,
		placeholder:
			projectType === 'series' ? 'My Custom Series' : 'My Drawing Primitive',
		validate(value) {
			if (value.length === 0) return 'A name is required!';
		},
	});
	if (isCancel(name)) throw new Error('Operation cancelled');

	const suggestedPackageName = toValidPackageName('lwc-plugin-' + name);
	const packageName = await text({
		message: 'Package Name for the Plugin?',
		placeholder: suggestedPackageName,
		initialValue: suggestedPackageName,
		validate(value) {
			if (value.length === 0) return 'A class name is required!';
			if (!value.startsWith('lwc-plugin-'))
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

	const includeHints = await confirm({
		message: 'Include hint comments?',
	});
	if (isCancel(includeHints)) throw new Error('Operation cancelled');

	const targetFolderPath = await text({
		message: `Relative Folder Path for Created Plugin? ${color.dim(
			'(leave blank to use current directory)'
		)}`,
		placeholder: packageName,
		initialValue: packageName,
        validate(value) {
            const cwd = process.cwd();
            const path = resolve(cwd, value);
            if (value && dirExists(path) && !isEmpty(path)) return 'folder already exists, and it is not empty!';
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
		projectType: projectType as 'series' | 'primitive',
		name,
		packageName,
		typeName,
		targetFolderPath,
		includeHints,
	};
}
