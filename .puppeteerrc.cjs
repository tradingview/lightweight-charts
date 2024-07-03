const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
	/**
	 * We need to set the cacheDirectory so that the CircleCI pipeline
	 * can reliably find the installed chrome binary
	 */
	cacheDirectory: join(__dirname, 'node_modules', '.cache', 'puppeteer'),
	downloadBaseUrl: 'https://storage.googleapis.com/chrome-for-testing-public',
	experiments: {
		/**
		 * This can also be configured / overridden with the
		 * PUPPETEER_EXPERIMENTAL_CHROMIUM_MAC_ARM
		 * env variable
		 */
		macArmChromiumEnabled: true,
	},
};
