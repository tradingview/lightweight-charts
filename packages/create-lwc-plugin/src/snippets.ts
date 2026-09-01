import { PluginCategory } from './questions';

export interface ReadmeSnippets {
	/** Minimal integration snippet, importing the plugin from the package. */
	attach: string;
	/** The same integration, importing the standalone build from a CDN. */
	cdnAttach: string;
	/** A fuller snippet showing data and options. */
	usage: string;
}

const NPM_IMPORT = `import { _CLASSNAME_ } from '_PACKAGENAME_';`;
const CDN_IMPORT = `import { _CLASSNAME_ } from 'https://unpkg.com/_PACKAGENAME_/dist/_ENTRYNAME_.standalone.js';`;

function snippets(
	libraryImports: string,
	body: string,
	usageBody: string
): ReadmeSnippets {
	const chart = `const chart = createChart(document.getElementById('container'));`;
	const libImport = `import { ${libraryImports} } from 'lightweight-charts';`;
	return {
		attach: [libImport, NPM_IMPORT, '', chart, body].join('\n'),
		cdnAttach: [libImport, CDN_IMPORT, '', chart, body].join('\n'),
		usage: [libImport, NPM_IMPORT, '', chart, usageBody].join('\n'),
	};
}

export const readmeSnippets: Record<PluginCategory, ReadmeSnippets> = {
	'custom-series': snippets(
		'createChart',
		`const series = chart.addCustomSeries(new _CLASSNAME_());
series.setData(data);`,
		`const series = chart.addCustomSeries(new _CLASSNAME_(), {
  // plugin-specific options
});
series.setData(data);`
	),
	'series-primitive': snippets(
		'createChart, LineSeries',
		`const series = chart.addSeries(LineSeries);
series.setData(data);

// Attach the plugin to the series
series.attachPrimitive(new _CLASSNAME_());`,
		`const series = chart.addSeries(LineSeries, { color: '#2962FF' });
series.setData(data);

// Attach the plugin to the series
const plugin = new _CLASSNAME_({
  // plugin-specific options
});
series.attachPrimitive(plugin);`
	),
	'pane-primitive': snippets(
		'createChart, LineSeries',
		`const series = chart.addSeries(LineSeries);
series.setData(data);

// Attach the plugin to a pane rather than to a series
chart.panes()[0].attachPrimitive(new _CLASSNAME_());`,
		`const series = chart.addSeries(LineSeries, { color: '#2962FF' });
series.setData(data);

// Attach the plugin to a pane rather than to a series
const plugin = new _CLASSNAME_({
  // plugin-specific options
});
chart.panes()[0].attachPrimitive(plugin);`
	),
};
