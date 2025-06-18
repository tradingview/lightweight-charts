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
	const shouldRenderChart = version === 'current' || parseInt(version.split('.')[0]) >= 5;

	React.useEffect(
		() => {
			const iframeElement = ref.current;
			const iframeWindow = iframeElement?.contentWindow as IFrameWindow<TVersion>;
			const iframeDocument = iframeElement?.contentDocument;

			if (iframeElement === null || !iframeWindow || !iframeDocument || !shouldRenderChart) {
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
			style={iframeStyle}
		/>
	);
}
