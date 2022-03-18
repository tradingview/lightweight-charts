import * as React from 'react';
import CodeBlock from '@theme-init/CodeBlock';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useDocsVersion } from '@docusaurus/theme-common';

import styles from './styles.module.css';

// The Webpack bundle fails to resolve the module at runtime if we try to use a dynamic
// import with a variable name (for example import(`lightweight-charts-${version}`)).
// There may be a way of making that work; if there is then we should remove this function.
function importLightweightChartsVersion(version) {
	switch (version) {
		case 'current': {
			return import('lightweight-charts');
		}
		default: {
			return Promise.reject(new Error('Unexpected Lightweight Charts version: ' + version));
		}
	}
}

function getSrcDocWithScript(script, parentOrigin) {
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

			window.parent.postMessage('ready', '${parentOrigin}');
			window.__READY_TO_RUN = true;
		</script>
	`;
}

const Chart = props => {
	const { script } = props;
	const { origin } = window;
	const { version } = useDocsVersion();
	const srcDoc = getSrcDocWithScript(script, origin);
	const ref = React.useRef();

	/**
	 * iOS Safari seems to run scripts within the iframe in a different order
	 * compared to desktop Chrome, Safari, etc.
	 *
	 * On the desktop browsers the React effect will run first, so the 'ready'
	 * event listener is added before the iframe script calls postMessage.
	 *
	 * On iOS Safari the iframe script runs before the React effect, so the
	 * 'ready' event listener hasn't been added yet!
	 *
	 * We use the __READY_TO_RUN flag to handle this case. If __READY_TO_RUN
	 * is true then we know that the inner window's run function can be
	 * called immediately and we don't need to register a event listener.
	 */
	React.useEffect(() => {
		const lightweightChartsImportPromise = importLightweightChartsVersion(version);
		const injectCreateChartAndRun = contentWindow => {
			lightweightChartsImportPromise.then(mod => {
				const createChart = mod.createChart;

				contentWindow.createChart = (container, options) => {
					const chart = createChart(container, options);
					const resizeListener = () => {
						const boundingClientRect = container.getBoundingClientRect();
						chart.resize(boundingClientRect.width, boundingClientRect.height);
					};

					contentWindow.addEventListener('resize', resizeListener, true);

					return chart;
				};

				contentWindow.run();
			});
		};

		if (ref.current.contentWindow.__READY_TO_RUN) {
			injectCreateChartAndRun(ref.current.contentWindow);
			return;
		}

		const readyMessageListener = event => {
			if (event.origin !== origin || event.source !== ref.current.contentWindow) {
				return;
			}

			if (event.data === 'ready') {
				injectCreateChartAndRun(event.source);
				window.removeEventListener('message', readyMessageListener, false);
			}
		};

		window.addEventListener('message', readyMessageListener, false);
	}, [origin]);

	return (
		<iframe
			ref={ref}
			srcDoc={srcDoc}
			className={styles.iframe}
		/>
	);
};

const ChartCodeBlock = props => {
	if (props.chart) {
		return (
			<>
				<CodeBlock {...props} />
				<BrowserOnly fallback={<div className={styles.iframe}>&nbsp;</div>}>{() => <Chart script={props.children} />}</BrowserOnly>
			</>
		);
	}

	return <CodeBlock {...props} />;
};

export default ChartCodeBlock;
