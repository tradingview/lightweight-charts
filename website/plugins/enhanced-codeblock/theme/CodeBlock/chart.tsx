import { useDocsVersion } from '@docusaurus/theme-common';
import * as React from 'react';

import { importLightweightChartsVersion, LightweightChartsApi } from './import-lightweight-charts-version';
import styles from './styles.module.css';

interface ChartProps {
	script: string;
}

type IFrameWindow = Window & {
	createChart: undefined | ((container: HTMLElement, options: never) => void);
	run: undefined | (() => void);
};

function getSrcDocWithScript(script: string, parentOrigin: string): string {
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
	const { origin } = window;
	const { version } = useDocsVersion();
	const srcDoc = getSrcDocWithScript(script, origin);
	const ref = React.useRef<HTMLIFrameElement>(null);

	React.useEffect(
		() => {
			const iframeElement = ref.current;
			const iframeWindow = iframeElement?.contentWindow as IFrameWindow;
			const iframeDocument = iframeElement?.contentDocument;

			if (iframeElement === null || !iframeWindow || !iframeDocument) {
				return;
			}

			const injectCreateChartAndRun = () => {
				importLightweightChartsVersion(version).then((mod: LightweightChartsApi) => {
					const createChart = mod.createChart;

					iframeWindow.createChart = (container: HTMLElement, options: never) => {
						const chart = createChart(container, options);
						const resizeListener = () => {
							const boundingClientRect = container.getBoundingClientRect();
							chart.resize(boundingClientRect.width, boundingClientRect.height);
						};

						iframeWindow.addEventListener('resize', resizeListener, true);

						return chart;
					};

					if (iframeWindow.run !== undefined) {
						iframeWindow.run();
					}
				})
				.catch((err: unknown) => {
					// eslint-disable-next-line no-console
					console.error(err);
				});
			};

			if (iframeDocument.readyState === 'complete' && iframeWindow.run !== undefined) {
				injectCreateChartAndRun();
			} else {
				const iframeLoadListener = () => {
					injectCreateChartAndRun();
					iframeElement.removeEventListener('load', iframeLoadListener);
				};

				iframeElement.addEventListener('load', iframeLoadListener);
			}
		},
		[origin, srcDoc]
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
