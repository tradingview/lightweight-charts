import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { intro, outro, spinner, cancel } from '@clack/prompts';
import color from 'picocolors';
import { Answers, askQuestions } from './questions';
import { copy } from './helpers/io';

const cwd = process.cwd();

const renameFiles: Record<string, string | undefined> = {
	_gitignore: '.gitignore',
};

async function init() {
	console.log();
	intro(color.inverse(' create-lwc-plugin '));

	let answers: Answers;
	try {
		answers = await askQuestions();
	} catch (e: unknown) {
		if (e instanceof Error) {
			cancel(e.message);
		}
		return process.exit(0);
	}

	const s = spinner();

	s.start('Building your new plugin project');
	const root = path.join(cwd, answers.targetFolderPath);
	if (answers.targetFolderPath) {
		fs.mkdirSync(root, { recursive: true });
	}
	const templateDir = path.resolve(
		fileURLToPath(import.meta.url),
		'../..',
		`template-${answers.projectType}`
	);
	const commonTemplateDir = path.resolve(
		fileURLToPath(import.meta.url),
		'../..',
		`template-common`
	);

	const entryName = 'template-entry';
	const newEntryName = answers.packageName.replace(/lwc-plugin-/, '');
	const entryFileName = `${entryName}.ts`;
	const newEntryFileName = `${newEntryName}.ts`;

	const contentsReplacer = (content: string): string => {
		const result = content
			.replaceAll(entryName, newEntryName)
			.replace(/_PLUGINNAME_/g, answers.name)
			.replace(/_CLASSNAME_/g, answers.typeName)
			.replace(/_PACKAGENAME_/g, answers.packageName);
		if (answers.includeHints) {
			return result;
		}
    	// Comments starting with '//*' are considered 'hints'
		return result.replace(/.*\/\/\*.*\r?\n/g, '');
	};

	const write = (dir: string, file: string, content?: string) => {
		const targetPath = path.join(root, renameFiles[file] ?? file);
		if (content) {
			fs.writeFileSync(targetPath, contentsReplacer(content));
		} else {
			copy(path.join(dir, file), targetPath, contentsReplacer);
		}
	};

	const files = fs.readdirSync(templateDir);
	for (const file of files) {
		write(templateDir, file);
	}

	const commonFiles = fs.readdirSync(commonTemplateDir);
	for (const file of commonFiles.filter(f => f !== 'package.json')) {
		write(commonTemplateDir, file);
	}

	const pkg = JSON.parse(
		fs.readFileSync(path.join(commonTemplateDir, `package.json`), 'utf-8')
	);

	pkg.name = answers.packageName;

	write(root, 'package.json', JSON.stringify(pkg, null, 2) + '\n');

	fs.renameSync(path.join(root, 'src', entryFileName), path.join(root, 'src', newEntryFileName));

	s.stop('Built your new plugin project');

	outro("You're all set!");
}

init().catch(e => {
	console.error(e);
});
