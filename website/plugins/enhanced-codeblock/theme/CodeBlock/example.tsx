// An example page's live chart and code, laid out like a plugin's page: the
// chart in a framed block with a caption, then a "Code" section with copy and
// source actions above the site's ordinary code block.
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import * as React from 'react';

import versions from '../../../../versions.json';
import { Chart } from './chart';
import styles from './example.module.css';

const REPOSITORY_FILE_URL = 'https://github.com/tradingview/lightweight-charts/blob/master/website/';
const DEFAULT_CHART_HEIGHT = 360;

// The code as a reader copies it: every line, without the magic comments that
// style the rendered block (`hide-*`, `highlight-*`), and without the `remove-*`
// sections, which are scaffolding the reader is never meant to see.
const MAGIC_COMMENT = /^[ \t]*\/\/[ \t]*(?:highlight-next-line|highlight-start|highlight-end|highlight-fade-start|highlight-fade-end|highlight-fade|hide-start|hide-end|hide-line)[ \t]*$/;
const TRAILING_MAGIC_COMMENT = /[ \t]*\/\/[ \t]*(?:highlight-next-line|highlight-fade|hide-line)[ \t]*$/;
const REMOVE_START = /^[ \t]*\/\/[ \t]*remove-start[ \t]*$/;
const REMOVE_END = /^[ \t]*\/\/[ \t]*remove-end[ \t]*$/;
const REMOVE_LINE = /^[ \t]*\/\/[ \t]*remove-line[ \t]*$/;

export function prepareExampleCode(code: string): string {
	const kept: string[] = [];
	const lines = code.split('\n');
	let inRemovedSection = false;
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (REMOVE_START.test(line)) {
			inRemovedSection = true;
		} else if (REMOVE_END.test(line)) {
			inRemovedSection = false;
		} else if (inRemovedSection || MAGIC_COMMENT.test(line)) {
			continue;
		} else if (REMOVE_LINE.test(line)) {
			index += 1;
		} else {
			kept.push(line.replace(TRAILING_MAGIC_COMMENT, ''));
		}
	}
	return kept.join('\n').trim() + '\n';
}

// The names the live examples use as globals. The standalone page takes the
// ones the code mentions from the `LightweightCharts` global of the UMD build.
const LIBRARY_EXPORTS = [
	'createChart',
	'createChartEx',
	'createYieldCurveChart',
	'createOptionsChart',
	'createSeriesMarkers',
	'createTextWatermark',
	'createImageWatermark',
	'createUpDownMarkers',
	'AreaSeries',
	'BarSeries',
	'BaselineSeries',
	'CandlestickSeries',
	'HistogramSeries',
	'LineSeries',
	'ColorType',
	'CrosshairMode',
	'LastPriceAnimationMode',
	'LineStyle',
	'LineType',
	'MismatchDirection',
	'PriceLineSource',
	'PriceScaleMode',
	'TickMarkType',
	'TrackingModeExitMode',
];

export function toStandaloneHtml(code: string, version: string): string {
	const used = LIBRARY_EXPORTS.filter((name: string) => new RegExp(`\\b${name}\\b`).test(code));
	const body = code.trimEnd().split('\n').map((line: string) => (line.length > 0 ? `\t\t${line}` : line)).join('\n');
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Lightweight Charts™ example</title>
	<script src="https://unpkg.com/lightweight-charts@${version}/dist/lightweight-charts.standalone.production.js"></script>
	<style>
		html, body { margin: 0; }
		#container { width: 100%; height: 100vh; }
	</style>
</head>
<body>
	<div id="container"></div>
	<script>
		const { ${used.join(', ')} } = LightweightCharts;

${body}
	</script>
</body>
</html>
`;
}

interface CopyResult {
	label: string;
	failed: boolean;
}

// The result of the last copy, shown on its button for a moment. The clipboard
// can refuse to be written, for example in an insecure context or without the
// page's focus; the button then says so.
function useCopy(): [CopyResult | null, (label: string, text: string) => void] {
	const [result, setResult] = React.useState<CopyResult | null>(null);
	const timeoutRef = React.useRef<number>();
	React.useEffect(() => () => window.clearTimeout(timeoutRef.current), []);
	const copy = React.useCallback(
		(label: string, text: string) => {
			const show = (failed: boolean) => {
				setResult({ label, failed });
				window.clearTimeout(timeoutRef.current);
				timeoutRef.current = window.setTimeout(() => setResult(null), 1500);
			};
			// `clipboard` is missing altogether outside a secure context.
			const written = navigator.clipboard?.writeText(text) ?? Promise.reject(new Error('No clipboard'));
			written.then(() => show(false), () => show(true));
		},
		[]
	);
	return [result, copy];
}

function copyLabelIndex(result: CopyResult | null, label: string): number {
	if (result?.label !== label) {
		return 0;
	}
	return result.failed ? 2 : 1;
}

// The example's code file sits next to its page under the same name.
function useSourceUrl(): string {
	const { metadata } = useDoc();
	return REPOSITORY_FILE_URL + metadata.source.replace(/^@site\//, '').replace(/\.mdx?$/, '.js');
}

/**
 * A button's text that changes on click (Copy code → Copied). Every variant is
 * laid out in the same grid cell and only the active one is visible, so the
 * button keeps the width of its longest text and its neighbors do not move.
 */
function ActionLabel({ labels, active }: { labels: string[]; active: number }): React.JSX.Element {
	return (
		<span className={styles.labelStack}>
			{labels.map((label: string, index: number) => (
				<span key={label} className={index === active ? undefined : styles.labelHidden} aria-hidden={index !== active}>
					{label}
				</span>
			))}
		</span>
	);
}

interface ExampleBlockProps {
	/** The code as the page ships it, theme colors already substituted. */
	code: string;
	/** The site's code block showing the same code, with its hidden lines. */
	codeBlock: React.ReactNode;
	iframeStyle?: React.CSSProperties;
}

export function ExampleBlock(props: ExampleBlockProps): React.JSX.Element {
	const { code, codeBlock, iframeStyle } = props;
	const [copyResult, copy] = useCopy();
	const [showAll, setShowAll] = React.useState(false);
	const sourceUrl = useSourceUrl();
	const copyableCode = React.useMemo(() => prepareExampleCode(code), [code]);
	const chartStyle = { height: DEFAULT_CHART_HEIGHT, ...iframeStyle };
	const hasHiddenLines = /\/\/[ \t]*hide-(?:start|line)\b/.test(code);

	return (
		<>
			<div className={styles.previewBlock}>
				{/* The page renders on the server without the chart; its frame keeps the height. */}
				<BrowserOnly fallback={<div style={chartStyle} />}>
					{() => <Chart script={code} iframeStyle={chartStyle} latestVersion />}
				</BrowserOnly>
				<div className={styles.previewCaption}>
					Interactive example &mdash; scroll, zoom, and hover the chart.
				</div>
			</div>

			{/* `Heading` adds the hash link and registers the anchor for the link checker. */}
			<Heading as="h2" id="code" className={styles.codeHeading}>Code</Heading>
			<div className={styles.actions}>
				{hasHiddenLines && (
					<button
						type="button"
						className={styles.action}
						data-tooltip={showAll ? 'Collapse the sample data in the code' : 'Expand the sample data hidden in the code'}
						aria-pressed={showAll}
						onClick={() => setShowAll(!showAll)}
					>
						<ActionLabel labels={['Show all code', 'Hide sample data']} active={showAll ? 1 : 0} />
					</button>
				)}
				<button
					type="button"
					className={styles.action}
					data-tooltip="Copy the code to the clipboard"
					onClick={() => copy('code', copyableCode)}
				>
					<ActionLabel labels={['Copy code', 'Copied', 'Copy failed']} active={copyLabelIndex(copyResult, 'code')} />
				</button>
				<button
					type="button"
					className={styles.action}
					data-tooltip="Copy a complete HTML page that loads the library from unpkg and runs on its own"
					onClick={() => copy('html', toStandaloneHtml(copyableCode, versions[0]))}
				>
					<ActionLabel labels={['Copy as HTML', 'Copied', 'Copy failed']} active={copyLabelIndex(copyResult, 'html')} />
				</button>
				<a
					className={styles.action}
					data-tooltip="Open the example's code file on GitHub"
					href={sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
				>
					View on GitHub
				</a>
			</div>
			{/* Drives the hidden-lines CSS of the code block that follows it. */}
			<input type="checkbox" className={`toggle-hidden-lines ${styles.toggle}`} checked={showAll} readOnly tabIndex={-1} aria-hidden="true" />
			{codeBlock}
			<p className={styles.note}>
				The code expects the library&rsquo;s exports, such as <code>createChart</code>, to be imported
				and a <code>div</code> with the id <code>container</code> on the page. <strong>Copy as HTML</strong>{' '}
				gives a page that runs on its own.
			</p>
		</>
	);
}
