import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { intro, outro, spinner, cancel, log, note } from '@clack/prompts';
import color from 'picocolors';
import { Answers, SkillChoice, askQuestions, askSkillInstall } from './questions';
import { scaffold } from './scaffold';

/** The repository the `skills` CLI installs from, and the skill to pick out of it. */
const SKILL_SOURCE = 'tradingview/lightweight-charts';
const SKILL_NAME = 'lightweight-charts-plugin-authoring';
const SKILL_COMMAND = `npx skills add ${SKILL_SOURCE} --skill ${SKILL_NAME}`;

/**
 * Installs the plugin-authoring skill into `dir` with the `skills` CLI, which
 * knows each assistant's directory conventions and fetches the current skill
 * rather than a copy frozen at this package's release. Its own prompts (which
 * assistants to install for) run with inherited stdio. A failure — offline, no
 * npx — is reported with the manual command and never aborts the wizard.
 */
function installSkill(dir: string): boolean {
	const result = spawnSync(SKILL_COMMAND, {
		cwd: dir,
		stdio: 'inherit',
		shell: true,
	});
	if (result.status === 0) {
		return true;
	}
	log.warn(
		`Could not install the skill. Run it yourself later, inside ${color.bold(
			dir
		)}:\n  ${color.cyan(SKILL_COMMAND)}`
	);
	return false;
}

/**
 * The hand-over: the skill goes into the current directory — where the user
 * will start their assistant — and the wizard stops. The assistant, reading
 * the skill, knows to settle the plugin type first and then run this wizard
 * with the user.
 */
function handOverToAssistant(): void {
	const installed = installSkill(cwd);
	note(
		[
			`Start your AI coding assistant in ${color.bold(cwd)} and describe the plugin`,
			'you have in mind. The skill tells it how to choose the plugin type, run',
			`${color.cyan('npm create lwc-plugin@latest')} with you, and build on the toolkit`,
			'and the official plugins.',
			...(installed ? [] : ['', `Install the skill first: ${color.cyan(SKILL_COMMAND)}`]),
		].join('\n'),
		'Next steps'
	);
	outro('Over to your assistant.');
}

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

	// The skill comes first so that someone building with an assistant can hand
	// over before answering anything else. Workspace scaffolds are not asked:
	// the skill's source already lives in this repository.
	let skill: SkillChoice = 'skip';
	let answers: Answers;
	try {
		if (!workspaceRequested) {
			skill = await askSkillInstall();
			if (skill === 'quit') {
				handOverToAssistant();
				return process.exit(0);
			}
		}
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

	// Into the project rather than the current directory: that is where the
	// user will open their assistant next.
	const skillInstalled = skill === 'continue' && installSkill(root);

	const relativeRoot = path.relative(cwd, root) || '.';
	const steps = relativeRoot === '.' ? [] : [`cd ${relativeRoot}`];
	note(
		(answers.workspace
			? [...steps, 'pnpm install', `pnpm --filter ${answers.packageName} build`]
			: [...steps, 'npm install', 'npm run dev']
		).join('\n'),
		'Next steps'
	);
	if (skillInstalled) {
		log.info(
			`The ${color.bold(SKILL_NAME)} skill is installed: your AI coding assistant now knows the toolkit, the reference plugins and the plugin docs.`
		);
	}

	outro("You're all set!");
}

init().catch(e => {
	console.error(e);
});
