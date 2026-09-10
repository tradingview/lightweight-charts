// Each config resolves its own package through exports, including /standalone.
// Private packages are skipped, as everywhere else in scripts/plugins.
import { basename, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { findWorkspacePlugins } from './utils.mjs';
const root = resolve(import.meta.dirname, '../..');
let failed = false;
for (const plugin of findWorkspacePlugins(root).sort((a, b) => a.dir.localeCompare(b.dir))) {
	console.log(`Type tests: ${basename(plugin.dir)}`);
	const result = spawnSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '-p', resolve(plugin.dir, 'tests/type-checks/tsconfig.json')], { cwd: root, stdio: 'inherit' });
	failed = failed || result.status !== 0;
}
process.exitCode = failed ? 1 : 0;
