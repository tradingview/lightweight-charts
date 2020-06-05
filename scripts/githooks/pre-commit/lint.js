#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const redColor = '\x1b[1;31m';
const noColor = '\x1b[0m';

const gitConflictRegex = /^(<{7}|={7}|>{7})(?:\s|$)/m;

function getStagedFiles() {
	return childProcess.execSync(
		'git diff --cached --name-only --diff-filter=ACM',
		{ encoding: 'utf-8' }
	).split('\n').map((str) => str.trim()).filter((str) => str.length !== 0);
}

function checkGitConflicts(files) {
	let hasErrors = false;
	for (const file of files) {
		const fileContent = fs.readFileSync(file, { encoding: 'utf-8' });
		if (gitConflictRegex.test(fileContent)) {
			console.error(`${file}: Unresolved git conflict found`);
			hasErrors = true;
			break;
		}
	}

	return hasErrors;
}

function run(cmd) {
	try {
		childProcess.execSync(cmd, { stdio: 'inherit' });
		return false;
	} catch (e) {
		return true;
	}
}

function shellEscape(arg) {
	if (!/[\s"$`]/.test(arg)) {
		return arg;
	}

	return `"${arg
		.replace(/"/g, '\\"')
		.replace(/\$/g, '\\$')
		.replace(/`/g, '\\`')
	}"`;
}

function runForFiles(cmd, files) {
	if (files.length === 0) {
		return false;
	}

	cmd += ' ';
	for (const file of files) {
		cmd += `${shellEscape(file)} `;
	}

	return run(cmd);
}

function runTSLintForFiles(tsFiles) {
	return runForFiles('node ./node_modules/tslint/bin/tslint --config tslint.json', tsFiles);
}

function runESLintForFiles(jsFiles) {
	return runForFiles('node ./node_modules/eslint/bin/eslint --quiet --format=unix', jsFiles);
}

function runMarkdownLintForFiles(mdFiles) {
	return runForFiles('node ./node_modules/markdownlint-cli/markdownlint.js', mdFiles);
}

function filterByExt(files, ext) {
	return files.filter((file) => path.extname(file) === ext);
}

function lintFiles(files) {
	let hasErrors = false;

	// eslint
	hasErrors = runESLintForFiles(filterByExt(files, '.js')) || hasErrors;

	// tsc & tslint
	const tsFiles = filterByExt(files, '.ts');
	if (tsFiles.length !== 0) {
		hasErrors = run('npm run tsc-verify') || hasErrors;

		// we won't run tslint for all files
		// because it's slow as fuck (18s for all project)
		// but we want to commit asap
		hasErrors = runTSLintForFiles(tsFiles) || hasErrors;
	}

	// markdown
	const mdFiles = filterByExt(files, '.md');
	if (mdFiles.length !== 0) {
		hasErrors = runMarkdownLintForFiles(mdFiles) || hasErrors;
		hasErrors = run('node scripts/check-markdown-links.js') || hasErrors;
	}

	return hasErrors;
}

function main() {
	const stagedFiles = getStagedFiles();
	const errorsPresent = checkGitConflicts(stagedFiles) || lintFiles(stagedFiles);

	if (errorsPresent) {
		console.error(`${redColor}
Errors encountered when running pre-commit script. Won't commit.
Review your changes and try again.
${noColor}`);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}
