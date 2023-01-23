'use strict';

if (process.env.NODE_ENV === 'production') {
	module.exports = require('./dist/lightweight-charts.esm.production.js');
} else {
	module.exports = require('./dist/lightweight-charts.esm.development.js');
}
