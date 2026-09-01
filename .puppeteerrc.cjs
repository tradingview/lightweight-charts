const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
	/**
	 * We need to set the cacheDirectory so that the CircleCI pipeline
	 * can reliably find the installed chrome binary.
	 * It lives outside of node_modules so that it survives node_modules
	 * wipes/reinstalls done by the CI scripts that build another revision
	 * of the repo in the same working tree.
	 */
	cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
	experiments: {
		/**
		 * This can also be configured / overridden with the
		 * PUPPETEER_EXPERIMENTAL_CHROMIUM_MAC_ARM
		 * env variable
		 */
		macArmChromiumEnabled: true,
	},
};
