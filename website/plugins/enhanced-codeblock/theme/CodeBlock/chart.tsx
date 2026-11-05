import { type PropVersionMetadata } from '@docusaurus/plugin-content-docs';
import { useDocsPreferredVersion } from '@docusaurus/theme-common';
import Admonition from '@theme/Admonition';
import * as React from 'react';

import versions from '../../../../versions.json';
import {
	importLightweightChartsVersion,
	LightweightChartsApiTypeMap,
	VersionsSupportingAdditionalChartTypes,
	VersionsSupportingCreateChartEx,
	VersionsSupportingTreeShakenSeries,
} from './import-lightweight-charts-version';
import { createPreviewSession, previewTextCss, PREVIEW_PAGE_CSS, type PreviewLook, type PreviewSession } from './preview';
import styles from './styles.module.css';

interface ChartProps {
	script: string;
	iframeStyle?: React.CSSProperties;
	/**
	 * Draws the chart as a gallery preview: these chart options are applied on
	 * top of the example's own (see `previewChartOptions`), and a long time
	 * range is narrowed to its most recent bars.
	 */
	previewOptions?: Record<string, unknown>;
	/**
	 * Runs the script on the latest release instead of the docs version the
	 * reader has picked. The examples are written for the latest release.
	 */
	latestVersion?: boolean;
	/** Called once a preview has its final range and has faded in. */
	onPreviewSettled?: () => void;
	/**
	 * The site theme's look for a preview. When it changes after the preview
	 * has run, the preview is restyled in place (see `PreviewSession.restyle`).
	 */
	previewLook?: PreviewLook;
}

type IFrameWindow<TVersion extends keyof LightweightChartsApiTypeMap> = Window & {
	createChart: LightweightChartsApiTypeMap[TVersion]['createChart'];
	createChartEx: TVersion extends VersionsSupportingCreateChartEx ? LightweightChartsApiTypeMap[TVersion]['createChartEx'] : undefined;
	createYieldCurveChart: TVersion extends VersionsSupportingAdditionalChartTypes ? LightweightChartsApiTypeMap[TVersion]['createYieldCurveChart'] : undefined;
	createOptionsChart: TVersion extends VersionsSupportingAdditionalChartTypes ? LightweightChartsApiTypeMap[TVersion]['createOptionsChart'] : undefined;
	LineSeries: TVersion extends VersionsSupportingTreeShakenSeries ? LightweightChartsApiTypeMap[TVersion]['LineSeries'] : undefined;
	AreaSeries: TVersion extends VersionsSupportingTreeShakenSeries ? LightweightChartsApiTypeMap[TVersion]['AreaSeries'] : undefined;
	CandlestickSeries: TVersion extends VersionsSupportingTreeShakenSeries ? LightweightChartsApiTypeMap[TVersion]['CandlestickSeries'] : undefined;
	BarSeries: TVersion extends VersionsSupportingTreeShakenSeries ? LightweightChartsApiTypeMap[TVersion]['BarSeries'] : undefined;
	HistogramSeries: TVersion extends VersionsSupportingTreeShakenSeries ? LightweightChartsApiTypeMap[TVersion]['HistogramSeries'] : undefined;
	run?: () => void;
};

// A preview stays hidden until its range is narrowed, then fades in.
const PREVIEW_FADE_MS = 200;
const PREVIEW_HIDDEN_STYLE: React.CSSProperties = { opacity: 0, transition: `opacity ${PREVIEW_FADE_MS}ms ease-out` };

function getSrcDocWithScript(script: string): string {
	const runScript = `
			window.run = () => {
				${script}
			};
	`;
	return `
		<style>
			html,
			body,
			#container {
				width: 100%;
				height: 100%;
				overflow: hidden;
				margin: 0;
			}
		</style>
		<div id="container"></div>
		<script>${runScript}</script>
	`;
}

export function Chart<TVersion extends keyof LightweightChartsApiTypeMap>(props: ChartProps): React.JSX.Element {
	const { script, iframeStyle, previewOptions, previewLook } = props;
	const { preferredVersion } = useDocsPreferredVersion() as { preferredVersion: (PropVersionMetadata & { name: string }) | null };
	const currentVersion = versions && versions.length > 0 ? versions[0] : '';
	const pinnedVersion = props.latestVersion ? currentVersion : undefined;
	const version = (pinnedVersion ?? preferredVersion?.name ?? currentVersion ?? 'current') as TVersion;
	const srcDoc = getSrcDocWithScript(script);
	const onPreviewSettledRef = React.useRef(props.onPreviewSettled);
	onPreviewSettledRef.current = props.onPreviewSettled;
	const ref = React.useRef<HTMLIFrameElement>(null);
	const previewSessionRef = React.useRef<PreviewSession>();
	// The look the preview was drawn in, to tell when it needs restyling.
	const previewLookRef = React.useRef(previewLook);
	const drawnLookRef = React.useRef<PreviewLook>();
	const shouldRenderChart = version === 'current' || parseInt(version.split('.')[0]) >= 5;

	React.useEffect(
		() => {
			const iframeElement = ref.current;
			const iframeWindow = iframeElement?.contentWindow as IFrameWindow<TVersion>;
			const iframeDocument = iframeElement?.contentDocument;

			if (iframeElement === null || !iframeWindow || !iframeDocument || !shouldRenderChart) {
				return;
			}

			// A preview is shown once its range is final, or right away when the
			// example has failed, so the card is not left blank.
			const revealPreview = () => {
				iframeElement.style.opacity = '1';
				// Reported once the fade-in is over, so whatever was shown in its
				// place can go without the frame dimming in between.
				window.setTimeout(() => onPreviewSettledRef.current?.(), PREVIEW_FADE_MS);
			};

			const injectCreateChartAndRun = async () => {
				try {
					const {
						module,
						createChart,
						createChartEx,
						createYieldCurveChart,
						createOptionsChart,
					} = await importLightweightChartsVersion[version](iframeWindow);

					Object.assign(iframeWindow, module); // Make ColorType, etc. available in the iframe
					const preview = previewOptions ? createPreviewSession(previewOptions) : undefined;
					previewSessionRef.current = preview;
					drawnLookRef.current = previewLookRef.current;
					// The document loaded from `srcDoc`, not the blank one the iframe
					// had when the effect started.
					const loadedHead = iframeElement.contentDocument?.head;
					if (preview && loadedHead) {
						const style = loadedHead.ownerDocument.createElement('style');
						style.textContent = PREVIEW_PAGE_CSS;
						loadedHead.appendChild(style);
					}
					iframeWindow.createChart = preview ? preview.wrap(createChart, true) : createChart;
					iframeWindow.createChartEx = preview && createChartEx ? preview.wrap(createChartEx, false) : createChartEx;
					iframeWindow.createYieldCurveChart = preview && createYieldCurveChart ? preview.wrap(createYieldCurveChart, false) : createYieldCurveChart;
					iframeWindow.createOptionsChart = preview && createOptionsChart ? preview.wrap(createOptionsChart, false) : createOptionsChart;

					const typedModule = module as unknown as {
						LineSeries: typeof iframeWindow.LineSeries;
						AreaSeries: typeof iframeWindow.AreaSeries;
						CandlestickSeries: typeof iframeWindow.CandlestickSeries;
						BarSeries: typeof iframeWindow.BarSeries;
						HistogramSeries: typeof iframeWindow.HistogramSeries;
					};
					iframeWindow.LineSeries = typedModule.LineSeries;
					iframeWindow.AreaSeries = typedModule.AreaSeries;
					iframeWindow.CandlestickSeries = typedModule.CandlestickSeries;
					iframeWindow.BarSeries = typedModule.BarSeries;
					iframeWindow.HistogramSeries = typedModule.HistogramSeries;
					iframeWindow.run?.();
					preview?.afterRun(revealPreview);
				} catch (err: unknown) {
					// eslint-disable-next-line no-console
					console.error(err);
					if (previewOptions) {
						revealPreview();
					}
				}
			};

			if (iframeWindow.run !== undefined) {
				// eslint-disable-next-line @typescript-eslint/no-floating-promises
				injectCreateChartAndRun();
			} else {
				const iframeLoadListener = () => {
					// eslint-disable-next-line @typescript-eslint/no-floating-promises
					injectCreateChartAndRun();
					iframeElement.removeEventListener('load', iframeLoadListener);
				};

				iframeElement.addEventListener('load', iframeLoadListener);
			}
		},
		[srcDoc]
	);

	previewLookRef.current = previewLook;
	React.useEffect(
		() => {
			// A preview that has not run yet will draw in the look it was made for.
			const session = previewSessionRef.current;
			const head = ref.current?.contentDocument?.head;
			if (!previewLook || !session || !head) {
				return;
			}
			session.restyle(previewLook);
			// Back in the look it was drawn in, the example's own text colors apply.
			if (previewLook.textColor === drawnLookRef.current?.textColor) {
				return;
			}
			const style = head.ownerDocument.createElement('style');
			style.textContent = previewTextCss(previewLook.textColor);
			head.appendChild(style);
			return () => style.remove();
		},
		[previewLook]
	);

	if (!shouldRenderChart) {
		return (
			<div>
			<Admonition type="caution" title="Chart visualization is not available for this version">
				<p>Switch to a version 5 or higher to see the chart</p>
			</Admonition>
		</div>
		);
	}

	return (
		<iframe
			key={script}
			ref={ref}
			srcDoc={srcDoc}
			className={styles.iframe}
			style={previewOptions ? { ...iframeStyle, ...PREVIEW_HIDDEN_STYLE } : iframeStyle}
		/>
	);
}
