// this file contains build-time constants
// which will be replaced (injected) by rollup while bundling
// see rollup.config.js for the reference

declare const process: {
	env: {
		NODE_ENV: 'development' | 'production';
		BUILD_VERSION: string;
	};
};
