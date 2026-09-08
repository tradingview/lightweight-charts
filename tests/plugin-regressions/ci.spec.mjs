// These exercise build ordering and restored artifacts in disposable workspaces.
// They intentionally fail until the two CI regressions are fixed.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '../..');
function fixture(t) {
	const dir = mkdtempSync(resolve(tmpdir(), 'lwc-ci-regression-'));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	return dir;
}
function write(dir, file, content, executable = false) {
	const path = resolve(dir, file);
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content, { mode: executable ? 0o755 : 0o644 });
}
function run(command, args, cwd, env = {}) {
	// pnpm 11 must not try to reinstall this deliberately minimal fixture.
	// eslint-disable-next-line camelcase
	const childEnv = { ...process.env, pnpm_config_verify_deps_before_run: 'false', ...env };
	// Nested node --test must launch a new runner, not inherit the parent worker.
	delete childEnv.NODE_TEST_CONTEXT;
	return spawnSync(command, args, { cwd, env: childEnv, encoding: 'utf8', timeout: 120000 });
}
function successful(result, message) {
	assert.equal(result.status, 0, `${message}\n${result.error ?? ''}\n${result.stdout}\n${result.stderr}`);
}

test('graphics merge-base build retains root declarations until plugin goldens are built', t => {
	const dir = fixture(t);
	// Both revisions contain the plugin: absence of pre-graduation goldens is
	// deliberately NOT the scenario under test.
	mkdirSync(resolve(dir, 'packages/lwc-plugin-fixture'), { recursive: true });
	write(dir, 'bin/git', `#!/bin/sh
case "$1" in
 rev-parse) echo head ;;
 merge-base) echo base ;;
 checkout) echo "$2" > revision ;;
 *) exit 2 ;;
esac
`, true);
	write(dir, 'bin/pnpm', `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
if (args[0] === 'install') process.exit(0);
if (args[0] === 'build' || args[0] === 'build:prod') {
 fs.mkdirSync('dist', { recursive: true });
 fs.writeFileSync('dist/typings.d.ts', 'export {};');
 fs.writeFileSync('dist/lightweight-charts.standalone.development.mjs', 'export {};');
} else if (args[0] === '--filter' && args.at(-1) === 'build') {
 const revision = fs.readFileSync('revision', 'utf8').trim();
 const hasTypes = fs.existsSync('dist/typings.d.ts');
 fs.appendFileSync('build-trace.jsonl', JSON.stringify({ revision, hasTypes }) + '\\n');
 if (!hasTypes) { console.error('Cannot resolve lightweight-charts declarations'); process.exit(1); }
 fs.mkdirSync('packages/lwc-plugin-fixture/dist', { recursive: true });
 fs.writeFileSync('packages/lwc-plugin-fixture/dist/fixture.standalone.js', 'export {};');
} else if (args[0] !== 'exec') {
 throw new Error('Unexpected pnpm invocation: ' + args.join(' '));
}
`, true);
	const result = run('bash', [resolve(root, 'scripts/run-graphics-tests.sh')], dir, {
		PATH: `${resolve(dir, 'bin')}:${process.env.PATH}`,
		CMP_OUT_DIR: './screenshots', GRAPHICS_TEST_SUITE: 'plugins',
		COMPARE_BRANCH: '', BRANCH_SPECIFIC_TEST: 'false', PRODUCTION_BUILD: 'false',
	});
	successful(result, 'The fixture shell pipeline must complete');
	const trace = readFileSync(resolve(dir, 'build-trace.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
	assert.ok(trace.some(entry => entry.revision === 'head' && entry.hasTypes), 'Control: HEAD has its declarations');
	assert.ok(existsSync(resolve(dir, 'merge-base-plugins-dist/lwc-plugin-fixture/fixture.standalone.js')),
		`Expected a golden for an already-existing plugin. Build trace: ${JSON.stringify(trace)}`);
});

// Only the small YAML subset used by these jobs is needed. Fail loudly if a
// job changes shape, rather than accidentally testing stale hardcoded commands.
function job(config, name) {
	const match = config.match(new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  [\\w-]+:|$(?![\\s\\S]))`, 'm'));
	assert.ok(match, `Missing CircleCI job: ${name}`);
	return match[1];
}
function runCommands(block) {
	const commands = [...block.matchAll(/^ {6}- run: (.+)$/gm)].map(match => match[1]);
	assert.ok(!/^ {6}- run:\s*$/m.test(block), 'Extend the fixture parser for structured run steps before changing this job');
	return commands;
}

test('the unit job can import accessibility tests from only its restored workspace artifacts', t => {
	const dir = fixture(t);
	const config = readFileSync(resolve(root, '.circleci/config.yml'), 'utf8');
	const buildJob = job(config, 'build');
	const unitJob = job(config, 'unittests');
	const persisted = [...buildJob.matchAll(/^ {12}- ([\w./*-]+)$/gm)].map(match => match[1]);
	assert.ok(persisted.includes('dist'), 'The fixture expects the core build workspace');
	assert.match(unitJob, /attach_workspace:/);
	// This is a clean checkout: copy source and manifests, never local plugin
	// dist/ or node_modules trees which could mask the missing CI prerequisite.
	for (const name of ['lwc-toolkit', 'lwc-plugin-accessibility']) {
		const folder = `packages/${name}`;
		for (const file of ['src', 'package.json']) {
			cpSync(resolve(root, folder, file), resolve(dir, folder, file), { recursive: true });
		}
		if (name === 'lwc-toolkit') {cpSync(resolve(root, folder, 'tsconfig.json'), resolve(dir, folder, 'tsconfig.json'));}
		mkdirSync(resolve(dir, folder, 'node_modules/@tradingview'), { recursive: true });
		symlinkSync(dir, resolve(dir, folder, 'node_modules/lightweight-charts'));
		symlinkSync(resolve(dir, 'packages/lwc-toolkit'), resolve(dir, folder, 'node_modules/@tradingview/lwc-toolkit'));
	}
	const spec = 'packages/lwc-plugin-accessibility/tests/unit/describe.spec.ts';
	mkdirSync(dirname(resolve(dir, spec)), { recursive: true });
	cpSync(resolve(root, spec), resolve(dir, spec));
	for (const path of persisted) {
		assert.ok(!path.includes('*'), 'Extend artifact restoration for glob paths');
		assert.ok(existsSync(resolve(root, path)), `Build the persisted artifact first: ${path}`);
		cpSync(resolve(root, path), resolve(dir, path), { recursive: true });
	}
	const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
	manifest.scripts.test = `node --import tsx --test ${spec}`;
	delete manifest.packageManager;
	write(dir, 'package.json', JSON.stringify(manifest));
	write(dir, 'pnpm-workspace.yaml', "packages:\n  - 'packages/*'\n");
	symlinkSync(resolve(root, 'node_modules'), resolve(dir, 'node_modules'));
	const commands = runCommands(unitJob);
	assert.ok(commands.includes('pnpm test'), 'Expected the actual unit-test command');
	let unitResult;
	for (const command of commands) {
		const result = run('bash', ['-c', command], dir, { TESTS_REPORT_FILE: '' });
		if (command === 'pnpm test') {unitResult = result;} else {successful(result, `Unit-job preparation failed: ${command}`);}
	}
	assert.ok(unitResult, 'The job must execute its tests');
	// A positive control proves that the fixture and test dependencies work:
	// build the toolkit locally, then rerun the exact same test import.
	successful(run(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '-p', 'packages/lwc-toolkit/tsconfig.json'], dir), 'Control: toolkit compilation');
	successful(run('pnpm', ['test'], dir, { TESTS_REPORT_FILE: '' }), 'Control: tests run after toolkit compilation');
	successful(unitResult, `The declared unit job must work before the control build. Restored paths: ${persisted.join(', ')}`);
});
