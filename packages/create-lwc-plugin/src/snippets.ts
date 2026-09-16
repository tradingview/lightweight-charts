import { PluginCategory } from './questions';

export interface ReadmeSnippets {
	/** Minimal integration snippet. */
	attach: string;
	/** A fuller snippet showing data and options. */
	usage: string;
}

/*
 The plugin is imported by name in both the npm and the CDN snippet: over a CDN
 an import map points that name at the standalone build, so the integration code
 is identical either way.
 */
const PLUGIN_IMPORT = `import { _CLASSNAME_ } from '_PACKAGENAME_';`;

function snippets(
	libraryImports: string,
	body: string,
	usageBody: string
): ReadmeSnippets {
	const chart = `const chart = createChart(document.getElementById('container'));`;
	const libImport = `import { ${libraryImports} } from 'lightweight-charts';`;
	return {
		attach: [libImport, PLUGIN_IMPORT, '', chart, body].join('\n'),
		usage: [libImport, PLUGIN_IMPORT, '', chart, usageBody].join('\n'),
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

/*
 The body of the scaffolded catalogue preview page, per category. Unlike the
 README snippets it imports the plugin by relative path, because it lives in the
 package next to the source it renders.
*/
export const previewSnippets: Record<PluginCategory, string> = {
	'custom-series': `import { createChart } from 'lightweight-charts';
import { _CLASSNAME_ } from '../_ENTRYNAME_';
import { generateSampleData } from '../sample-data';

const chart = createChart('chart', { autoSize: true });

const series = chart.addCustomSeries(new _CLASSNAME_(), {
	/* Options */
});
series.setData(generateSampleData(200, 50));
chart.timeScale().fitContent();
`,
	'series-primitive': `import { LineSeries, createChart } from 'lightweight-charts';
import { _CLASSNAME_ } from '../_ENTRYNAME_';
import { generateLineData } from '../sample-data';

const chart = createChart('chart', { autoSize: true });

const series = chart.addSeries(LineSeries, { color: '#2962FF' });
const data = generateLineData(200);
series.setData(data);

series.attachPrimitive(
	new _CLASSNAME_(
		{ price: 100, time: data[data.length - 50].time },
		{ price: 500, time: data[data.length - 10].time }
	)
);
chart.timeScale().fitContent();
`,
	'pane-primitive': `import { LineSeries, createChart } from 'lightweight-charts';
import { _CLASSNAME_ } from '../_ENTRYNAME_';
import { generateLineData } from '../sample-data';

const chart = createChart('chart', { autoSize: true });

const series = chart.addSeries(LineSeries, { color: '#2962FF' });
series.setData(generateLineData(200));

chart.panes()[0].attachPrimitive(
	new _CLASSNAME_({ text: '_PLUGINNAME_', corner: 'top-left' })
);
chart.timeScale().fitContent();
`,
};
