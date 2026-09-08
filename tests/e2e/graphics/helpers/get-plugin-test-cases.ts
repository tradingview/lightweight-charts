/// <reference types="node" />
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TestCase } from './get-test-cases';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

export const packagesDir = path.resolve(currentDirectory, '../../../../packages');

export interface PluginTestCasesGroup {
	/** Package folder name, e.g. `lwc-plugin-vertical-line`; also the group name. */
	folder: string;
	/** Published package name, the import map key the plugin is imported by. */
	packageName: string;
	/** Standalone bundle file name inside the package's `dist/`. */
	standaloneFileName: string;
	testCases: TestCase[];
}

let testFilterRegex: RegExp | undefined;
if (process.env.GREP) {
	testFilterRegex = new RegExp(process.env.GREP);
}

function readTestCases(dir: string, folder: string): TestCase[] {
	return fs.readdirSync(dir)
		.filter((file: string) => /^[^.].+\.js$/.test(file) && fs.lstatSync(path.join(dir, file)).isFile())
		.filter((file: string) => testFilterRegex === undefined || testFilterRegex.test(`${folder}/${file.slice(0, -3)}`))
		.map((file: string) => ({
			name: file.slice(0, -3),
			caseContent: fs.readFileSync(path.join(dir, file), { encoding: 'utf-8' }),
		}));
}

/**
 * Discovers `packages/lwc-plugin-*\/tests/graphics/*.js`. The group name is the
 * package folder, so `GREP="lwc-plugin-"` selects the whole suite and
 * `GREP="lwc-plugin-vertical-line/"` one package.
 */
export function getPluginTestCases(): PluginTestCasesGroup[] {
	if (!fs.existsSync(packagesDir)) {
		return [];
	}
	const groups: PluginTestCasesGroup[] = [];
	for (const folder of fs.readdirSync(packagesDir).sort()) {
		if (!folder.startsWith('lwc-plugin-')) {
			continue;
		}
		const casesDir = path.join(packagesDir, folder, 'tests', 'graphics');
		const packageJsonPath = path.join(packagesDir, folder, 'package.json');
		if (!fs.existsSync(casesDir) || !fs.existsSync(packageJsonPath)) {
			continue;
		}
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf-8' })) as { name: string };
		const testCases = readTestCases(casesDir, folder);
		if (testCases.length === 0) {
			continue;
		}
		groups.push({
			folder,
			packageName: packageJson.name,
			standaloneFileName: `${folder.replace(/^lwc-plugin-/, '')}.standalone.js`,
			testCases,
		});
	}
	return groups;
}

/**
 * Locates a package's standalone bundle under `dir`, which holds either the
 * packages themselves (`<folder>/dist/<file>`) or copies of their `dist`
 * folders (`<folder>/<file>`).
 */
export function findPluginStandalone(dir: string, group: PluginTestCasesGroup): string | null {
	for (const candidate of [
		path.join(dir, group.folder, 'dist', group.standaloneFileName),
		path.join(dir, group.folder, group.standaloneFileName),
	]) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}
	return null;
}
