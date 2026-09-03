import fs from 'node:fs';
import path from 'node:path';
import { intro, outro, spinner, cancel, note } from '@clack/prompts';
import color from 'picocolors';
import { Answers, askQuestions } from './questions';
import { scaffold } from './scaffold';

const cwd = process.cwd();

const WORKSPACE_MARKER = 'pnpm-workspace.yaml';

/** Walks up from `from` looking for the root of the pnpm workspace. */
function findWorkspaceRoot(from: string): string | null {
	let current = from;
	for (;;) {
		if (fs.existsSync(path.join(current, WORKSPACE_MARKER))) return current;
		const parent = path.dirname(current);
		if (parent === current) return null;
		current = parent;
	}
}

async function init() {
	console.log();
	intro(color.inverse(' create-lwc-plugin '));

	const workspaceRequested = process.argv.includes('--workspace');
	let workspaceRoot: string | null = null;
	if (workspaceRequested) {
		workspaceRoot = findWorkspaceRoot(cwd);
		if (workspaceRoot === null) {
			cancel(
				`--workspace must be run inside the lightweight-charts repository (no ${WORKSPACE_MARKER} found).`
			);
			return process.exit(1);
		}
	}

	// Workspace packages are placed relative to the repository root, standalone
	// projects relative to the current directory.
	const baseDir = workspaceRoot ?? cwd;

	let answers: Answers;
	try {
		answers = await askQuestions(workspaceRequested, baseDir);
	} catch (e: unknown) {
		if (e instanceof Error) {
			cancel(e.message);
		}
		return process.exit(0);
	}

	const s = spinner();
	s.start('Building your new plugin project');
	const root = scaffold(answers, baseDir);
	s.stop('Built your new plugin project');

	const relativeRoot = path.relative(cwd, root) || '.';
	const steps = relativeRoot === '.' ? [] : [`cd ${relativeRoot}`];
	note(
		(answers.workspace
			? [...steps, 'pnpm install', `pnpm --filter ${answers.packageName} build`]
			: [...steps, 'npm install', 'npm run dev']
		).join('\n'),
		'Next steps'
	);

	outro("You're all set!");
}

init().catch(e => {
	console.error(e);
});
