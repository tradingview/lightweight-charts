'use strict';

if (process.env.NODE_ENV === 'production') {
	module.exports = require('./dist/lightweight-charts.production.cjs');
} else {
	module.exports = require('./dist/lightweight-charts.development.cjs');
}
