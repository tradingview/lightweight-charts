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
		<style>html, body, #container { width: 100%; height: 100%; overflow: hidden; }</style>
		<div id="container"></div>
		<script>
			window.run = () => {
				${script}
			};

			window.parent.postMessage('ready', '${parentOrigin}');
		</script>
	`;
}

const Chart = props => {
	const { script } = props;
	const { origin } = window;
	const srcDoc = getSrcDocWithScript(script, origin);
	const ref = React.useRef();

	const { version } = useDocsVersion();

	React.useEffect(() => {
		const lightweightChartsImportPromise = importLightweightChartsVersion(version);

		const readyMessageListener = event => {
			if (event.origin !== origin || event.source !== ref.current.contentWindow) {
				return;
			}

			if (event.data === 'ready') {
				window.removeEventListener('message', readyMessageListener, false);

				lightweightChartsImportPromise.then(mod => {
					const createChart = mod.createChart;
					const contentWindow = event.source;

					contentWindow.createChart = (container, options) => {
						const chart = createChart(container, options);
						const resizeListener = () => {
							const boundingClientRect = container.getBoundingClientRect();
							chart.resize(boundingClientRect.width, boundingClientRect.height);
						};

						contentWindow.addEventListener('resize', resizeListener, true);

						return chart;
					};

					event.source.run();
				});
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
