const path = require('path');

module.exports = function chartCodeBlockPlugin(context, options) {
	return {
		name: 'chart-codeblock',

		getThemePath: () => path.resolve(__dirname, './theme'),
	};
};
