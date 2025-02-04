/*
	This suppresses the 'ResizeObserver loop completed with undelivered notification'
	error which can appear when viewing the website in developer mode. This only
	prevents the error appearing on the overlay. It will still be visible in the console.
*/
module.exports = function suppressResizeObserverError() {
	return {
		name: 'suppress-resize-observer-error',
		configureWebpack(_config, isServer, _utils) {
			if (!isServer) {
				return {
					devServer: {
						client: {
							overlay: {
								runtimeErrors: error => {
									if (
										error.message.includes('ResizeObserver') &&
										error.message.includes('undelivered notification')
									) {
										return false;
									}
									return true;
								},
							},
						},
					},
				};
			}
			return {};
		},
	};
};
