#!/usr/bin/env node

import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const redColor = '\x1b[1;31m';
const noColor = '\x1b[0m';

const gitConflictRegex = /^(<{7}|={7}|>{7})(?:\s|$)/m;

function getStagedFiles() {
	return childProcess.execSync(
		'git diff --cached --name-only --diff-filter=ACM',
		{ encoding: 'utf-8' }
	).split('\n').map(str => str.trim()).filter(str => str.length !== 0);
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

function run(file, args) {
	try {
		childProcess.execFileSync(file, args, { stdio: 'inherit' });
		return false;
	} catch (e) {
		return true;
	}
}

// Only use this for static command strings with no dynamic content.
// This keeps fixed package manager commands compatible with Windows shells.
function runShell(command) {
	try {
		childProcess.execSync(command, { stdio: 'inherit' });
		return false;
	} catch (e) {
		return true;
	}
}

function runForFiles(file, baseArgs, files) {
	if (files.length === 0) {
		return false;
	}

	return run(file, [...baseArgs, ...files]);
}

function runESLintForFiles(files) {
	if (files.length === 0) {
		return false;
	}

	// Staged filenames are untrusted input, so this must avoid shell execution.
	return runForFiles('node', ['./node_modules/eslint/bin/eslint', '--quiet', '--format=unix'], files);
}

function runMarkdownLintForFiles(mdFiles) {
	// Staged filenames are untrusted input, so this must avoid shell execution.
	return runForFiles('node', ['./node_modules/markdownlint-cli/markdownlint.js'], mdFiles);
}

function filterByExt(files, ext) {
	return files.filter(file => path.extname(file) === ext);
}

// eslint-disable-next-line complexity
function lintFiles(files) {
	let hasErrors = false;

	// eslint for js and jsxd
	hasErrors = runESLintForFiles(filterByExt(files, '.js')) || hasErrors;
	hasErrors = runESLintForFiles(filterByExt(files, '.jsx')) || hasErrors;

	// tsc & eslint for ts files
	const tsFiles = filterByExt(files, '.ts');
	const tsxFiles = filterByExt(files, '.tsx');
	if (tsFiles.length !== 0 || tsxFiles.length !== 0) {
		hasErrors = runShell('pnpm run tsc-verify') || hasErrors;
		hasErrors = runESLintForFiles(tsFiles) || hasErrors;
		hasErrors = runESLintForFiles(tsxFiles) || hasErrors;
	}

	// markdown
	const mdFiles = filterByExt(files, '.md');
	if (mdFiles.length !== 0) {
		// yeah, eslint might check code inside markdown files
		hasErrors = runESLintForFiles(mdFiles) || hasErrors;
		hasErrors = runMarkdownLintForFiles(mdFiles) || hasErrors;
		hasErrors = run('node', ['scripts/check-markdown-links.js']) || hasErrors;
	}

	// markdown react
	const mdxFiles = filterByExt(files, '.mdx');
	if (mdxFiles.length !== 0) {
		hasErrors = runESLintForFiles(mdxFiles) || hasErrors;
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

main();
