// this file contains build-time constants
// which will be replaced (injected) by rollup while bundling
// see rollup.config.js for the reference

declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: 'development' | 'production';
		BUILD_VERSION: string;
	}

	interface Process {
		env: ProcessEnv;
	}
}

declare var process: NodeJS.Process;
