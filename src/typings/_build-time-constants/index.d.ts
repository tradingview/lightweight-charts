// this file contains build-time constants
// which will be replaced (injected) by rollup while bundling
// see rollup.config.js for the reference

declare namespace NodeJS {
	interface ProcessEnv {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		NODE_ENV: 'development' | 'production';

		// eslint-disable-next-line @typescript-eslint/naming-convention
		BUILD_VERSION: string;
	}

	interface Process {
		env: ProcessEnv;
	}
}

// eslint-disable-next-line no-var
declare var process: NodeJS.Process;
