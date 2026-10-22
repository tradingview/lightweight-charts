// Verifies that the attribution logo link contains the plain semver library
// version (without any pre-release or build metadata) while `version()` keeps
// returning the full build version.

let href = null;

function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return [];
}

function beforeInteractions(container) {
	LightweightCharts.createChart(container, {
		layout: {
			attributionLogo: true,
		},
	});

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			const link = container.querySelector('a#tv-attr-logo');
			href = link ? link.href : null;
			resolve();
		});
	});
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	if (href === null) {
		throw new Error('Expected the attribution logo link to be rendered');
	}

	const url = new URL(href);
	const params = url.searchParams;

	if (params.get('utm_medium') !== 'lwc-link' || params.get('utm_campaign') !== 'lwc-chart') {
		throw new Error(`Expected the existing utm parameters to be preserved, got ${href}`);
	}

	const lwcVersion = params.get('lwc_version');
	if (lwcVersion === null || !/^\d+\.\d+\.\d+$/.test(lwcVersion)) {
		throw new Error(`Expected lwc_version to be a plain MAJOR.MINOR.PATCH version, got ${href}`);
	}

	const fullVersion = LightweightCharts.version();
	if (!fullVersion.startsWith(lwcVersion)) {
		throw new Error(`Expected lwc_version (${lwcVersion}) to match the library version (${fullVersion})`);
	}

	return Promise.resolve();
}
