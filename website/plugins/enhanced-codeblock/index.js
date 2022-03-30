const path = require('path');

module.exports = function chartCodeBlockPlugin(context, options) {
	return {
		name: 'enhanced-codeblock',

		getThemePath: () => path.resolve(__dirname, './theme'),
	};
};
