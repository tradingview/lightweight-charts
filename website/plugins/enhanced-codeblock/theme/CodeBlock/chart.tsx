import { type PropVersionMetadata } from '@docusaurus/plugin-content-docs';
import { useDocsPreferredVersion } from '@docusaurus/theme-common';
import * as React from 'react';

import versions from '../../../../versions.json';
import {
	importLightweightChartsVersion,
	LightweightChartsApiTypeMap,
	VersionsSupportingAdditionalChartTypes,
	VersionsSupportingCreateChartEx,
	VersionsSupportingTreeShakenSeries,
} from './import-lightweight-charts-version';
import styles from './styles.module.css';

interface ChartProps {
	script: string;
	iframeStyle?: React.CSSProperties;
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

function getSrcDocWithScript(script: string): string {
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
		<script>
			window.run = () => {
				${script}
			};
		</script>
	`;
}

export function Chart<TVersion extends keyof LightweightChartsApiTypeMap>(props: ChartProps): React.JSX.Element {
	const { script, iframeStyle } = props;
	const { preferredVersion } = useDocsPreferredVersion() as { preferredVersion: (PropVersionMetadata & { name: string }) | null };
	const currentVersion = versions && versions.length > 0 ? versions[0] : '';
	const version = (preferredVersion?.name ?? currentVersion ?? 'current') as TVersion;
	const srcDoc = getSrcDocWithScript(script);
	const ref = React.useRef<HTMLIFrameElement>(null);

	React.useEffect(
		() => {
			const iframeElement = ref.current;
			const iframeWindow = iframeElement?.contentWindow as IFrameWindow<TVersion>;
			const iframeDocument = iframeElement?.contentDocument;

			if (iframeElement === null || !iframeWindow || !iframeDocument) {
				return;
			}

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
					iframeWindow.createChart = createChart;
					iframeWindow.createChartEx = createChartEx;
					iframeWindow.createYieldCurveChart = createYieldCurveChart;
					iframeWindow.createOptionsChart = createOptionsChart;

					if (version === 'current') {
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
					}
					iframeWindow.run?.();
				} catch (err: unknown) {
					// eslint-disable-next-line no-console
					console.error(err);
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

	return (
		<iframe
			key={script}
			ref={ref}
			srcDoc={srcDoc}
			className={styles.iframe}
			style={iframeStyle}
		/>
	);
}
