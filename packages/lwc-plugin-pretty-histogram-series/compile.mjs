import { build, defineConfig } from 'vite';
import { generateDtsBundle } from 'dts-bundle-generator';
import { compilePlugin } from '../../scripts/plugins/compile-plugin.mjs';

await compilePlugin(import.meta.url, { build, defineConfig, generateDtsBundle });
