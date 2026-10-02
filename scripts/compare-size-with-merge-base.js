#!/usr/bin/env node

/**
 * This script uses size-limit to show size changes since merge-base
 */

import * as childProcess from 'node:child_process';
import bytes from 'bytes';
import sizeLimit from 'size-limit';
import filePlugin from '@size-limit/file';

import sizeLimitConfig from '../.size-limit.js';

function run(file, args) {
	try {
		return {
			success: true,
			output: childProcess.execFileSync(file, args, { encoding: 'utf-8', stdio: 'pipe' }).trim(),
		};
	} catch (e) {
		return { success: false, output: e.stderr || e.stdout || e.toString() };
	}
}

// Only use this for static command strings with no dynamic content.
// This keeps fixed npm commands compatible with Windows shells.
function runShell(command) {
	try {
		return {
			success: true,
			output: childProcess.execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim(),
		};
	} catch (e) {
		return { success: false, output: e.stderr || e.stdout || e.toString() };
	}
}

function runForSuccess(file, args) {
	runForOutput(file, args);
}

function runShellForSuccess(command) {
	runShellForOutput(command);
}

function runForOutput(file, args) {
	const res = run(file, args);
	if (!res.success) {
		console.error(`Can't execute "${file} ${args.join(' ')}":\n${res.output}`);
		process.exit(1);
	}

	return res.output;
}

function runShellForOutput(command) {
	const res = runShell(command);
	if (!res.success) {
		console.error(`Can't execute "${command}":\n${res.output}`);
		process.exit(1);
	}

	return res.output;
}

async function getSizes() {
	const result = new Map();
	await Promise.all(sizeLimitConfig.map(async file => {
		const [res] = await sizeLimit([filePlugin], [file.path]);
		result.set(file.path, res.size);
	}));

	return result;
}

function formatNumber(val) {
	return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
}

function formatSizeChange(val) {
	return val > 0 ? `+${bytes(val)}` : bytes(val);
}

function formatChange(newSize, oldSize) {
	const diff = newSize - oldSize;
	const diffInPercent = ((newSize - oldSize) / oldSize) * 100;
	return `${formatSizeChange(diff)} (${formatNumber(diffInPercent)}%)`;
}

const compareBranch = process.env.COMPARE_BRANCH;

async function main() {
	let headRev = runForOutput('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
	if (headRev.length === 0 || headRev === 'HEAD') {
		headRev = runForOutput('git', ['rev-parse', 'HEAD']);
	}

	const revToCheck = compareBranch
		? runForOutput('git', ['rev-parse', `origin/${compareBranch}`])
		: runForOutput('git', ['merge-base', 'origin/master', headRev]);

	console.log(`Using "${revToCheck}" as base\n`);

	console.log(`Switching to ${revToCheck}`);
	runForSuccess('git', ['checkout', revToCheck]);

	console.log(`Installing dependencies...`);
	runShellForSuccess('pnpm install --frozen-lockfile');

	console.log(`Building the library...`);
	runShellForSuccess('pnpm build:prod');

	const oldSizes = await getSizes();

	console.log(`\nSwitching back to ${headRev}`);
	runForSuccess('git', ['checkout', headRev]);

	console.log(`Installing dependencies...`);
	runShellForSuccess('pnpm install --frozen-lockfile');

	console.log(`Building the library...`);
	runShellForSuccess('pnpm build:prod');

	const newSizes = await getSizes();

	const output = [];
	newSizes.forEach((size, path) => {
		output.push(`${path}: ${bytes(size)}, ${formatChange(size, oldSizes.get(path))}`);
	});
	console.log(`\nResults:\n${output.sort().map(s => `- ${s}`).join('\n')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
