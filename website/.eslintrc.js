module.exports = {
	parser: '@babel/eslint-parser',
	parserOptions: {
		requireConfigFile: false,
	},
	extends: [
		'eslint:recommended',
		'plugin:react/recommended',
	],
};
