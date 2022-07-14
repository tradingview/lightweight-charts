import { useDocsVersion } from '@docusaurus/theme-common';
import * as React from 'react';

import { importLightweightChartsVersion, LightweightChartsApi, LightweightChartsVersion } from './import-lightweight-charts-version';
import styles from './styles.module.css';

interface ChartProps {
	script: string;
}

type IFrameWindow = Window & {
	createChart: (...args: Parameters<LightweightChartsApi['createChart']>) => ReturnType<LightweightChartsApi['createChart']>;
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

export const Chart = (props: ChartProps): JSX.Element => {
	const { script } = props;
	const { version } = useDocsVersion();
	const srcDoc = getSrcDocWithScript(script);
	const ref = React.useRef<HTMLIFrameElement>(null);

	React.useEffect(
		() => {
			const iframeElement = ref.current;
			const iframeWindow = iframeElement?.contentWindow as IFrameWindow;
			const iframeDocument = iframeElement?.contentDocument;

			if (iframeElement === null || !iframeWindow || !iframeDocument) {
				return;
			}

			const injectCreateChartAndRun = async () => {
				try {
					const mod = await importLightweightChartsVersion(version as LightweightChartsVersion);

					const createChart = mod.createChart;
					Object.assign(iframeWindow, mod); // Make ColorType, etc. available in the iframe

					type ChartsApi = (typeof mod);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
					(iframeWindow as any).createChart = (container: HTMLElement | string, options?: Parameters<ChartsApi['createChart']>[1]) => {
						const chart = createChart(container, options);
						const resizeListener = () => {
							const boundingClientRect = (container as HTMLElement).getBoundingClientRect();
							chart.resize(boundingClientRect.width, boundingClientRect.height);
						};

						iframeWindow.addEventListener('resize', resizeListener, true);

						return chart;
					};

					iframeWindow.run?.();
				} catch (err: unknown) {
					// eslint-disable-next-line no-console
					console.error(err);
				}
			};

			if (iframeWindow.run !== undefined) {
				injectCreateChartAndRun();
			} else {
				const iframeLoadListener = () => {
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
		/>
	);
};
