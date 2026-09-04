const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

/**
 * Exposes the plugin catalogue data to the site, see ./types.d.ts for the shape
 * and README.md for where each field comes from.
 *
 * The data is produced by the repository script so that the docs build, the CI
 * gates and a maintainer's terminal all use one implementation. A failing
 * script (invalid metadata, unreachable registry) fails the docs build.
 */
module.exports = function pluginCatalogue(context) {
	const repoRoot = path.resolve(context.siteDir, '..');
	const script = path.join(repoRoot, 'scripts/plugins/catalogue.mjs');

	return {
		name: 'lwc-plugin-catalogue',

		// The dev server re-runs loadContent when these change.
		getPathsToWatch: () => [
			path.join(repoRoot, 'packages/lwc-plugin-*/package.json'),
			path.join(repoRoot, 'packages/lwc-plugin-*/README.md'),
		],

		async loadContent() {
			let result;
			try {
				result = await execFileAsync(process.execPath, [script], {
					cwd: context.siteDir,
					encoding: 'utf-8',
					maxBuffer: 64 * 1024 * 1024,
				});
			} catch (err) {
				if (err.stderr) {
					process.stderr.write(err.stderr);
				}
				throw new Error(`The plugin catalogue could not be built (see the errors above): ${err.message}`);
			}
			// The script's warnings and summary belong in the build log.
			if (result.stderr) {
				process.stderr.write(result.stderr);
			}
			return JSON.parse(result.stdout);
		},

		async contentLoaded({ content, actions }) {
			// Global data is loaded on every page, so it carries everything but the
			// READMEs. Each full entry is written as its own JSON module for the
			// per-plugin pages to load through their route (createData + addRoute).
			await Promise.all(content.plugins.map(entry => actions.createData(`${entry.slug}.json`, JSON.stringify(entry))));
			actions.setGlobalData({
				registry: content.registry,
				unpublished: content.unpublished,
				plugins: content.plugins.map(({ readme, ...summary }) => summary),
			});
		},
	};
};
