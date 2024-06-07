import { join } from 'node:path';

/**
 * @type {import("puppeteer").Configuration}
 */
const puppeteerConfig = {
	/**
	 * We need to set the cacheDirectory so that the CircleCI pipeline
	 * can reliably find the installed chrome binary
	 */
	cacheDirectory: join(new URL('.', import.meta.url).pathname, 'node_modules', '.cache', 'puppeteer'),
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

export default puppeteerConfig;
