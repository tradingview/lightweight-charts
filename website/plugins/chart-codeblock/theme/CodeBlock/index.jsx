import * as React from 'react';
import CodeBlock from '@theme-init/CodeBlock';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { createChart } from 'lightweight-charts';

import styles from './styles.module.css';

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

	React.useEffect(() => {
		const readyMessageListener = event => {
			if (event.origin !== origin || event.source !== ref.current.contentWindow) {
				return;
			}

			if (event.data === 'ready') {
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
				{/* <BrowserOnly fallback={<div className={styles.iframe}>&nbsp;</div>}>{() => <div className={styles.iframe}>&nbsp;</div>}</BrowserOnly> */}
				<BrowserOnly fallback={<div className={styles.iframe}>&nbsp;</div>}>{() => <Chart script={props.children} />}</BrowserOnly>
			</>
		);
	}

	return <CodeBlock {...props} />;
};

export default ChartCodeBlock;
