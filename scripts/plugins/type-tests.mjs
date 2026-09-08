// Each config resolves its own package through exports, including /standalone.
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '../..');
let failed = false;
for (const name of readdirSync(resolve(root, 'packages')).filter(folder => folder.startsWith('lwc-plugin-')).sort()) {
	console.log(`Type tests: ${name}`);
	const result = spawnSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '-p', resolve(root, 'packages', name, 'tests/type-checks/tsconfig.json')], { cwd: root, stdio: 'inherit' });
	failed = failed || result.status !== 0;
}
process.exitCode = failed ? 1 : 0;
