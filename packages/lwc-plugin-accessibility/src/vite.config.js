import { defineConfig } from 'vite';

const input = {
	main: './src/example/index.html',
	es: './src/example/index.es.html',
};

export default defineConfig({
	build: {
		rollupOptions: {
			input,
		},
	},
});
