import * as React from 'react';
import CodeBlock from '@theme-init/CodeBlock';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { createChart } from 'lightweight-charts';

import styles from './styles.module.css';

function getSrcDocWithScript(script) {
	return `
		<style>html, body, #container { width: 100%; height: 100%; }</style>
		<div id="container"></div>
		<script>
			${script}
		</script>
	`;
}

const Chart = props => {
	const { script } = props;
	const srcDoc = getSrcDocWithScript(script);

	const ref = React.useRef();

	React.useEffect(() => {
		const contentWindow = ref.current.contentWindow;

		contentWindow.createChart = (container, options) => {
			const chart = createChart(container, options);
			const onResize = () => {
				const boundingClientRect = container.getBoundingClientRect();
				chart.resize(boundingClientRect.width, boundingClientRect.height);
			};

			contentWindow.onresize = onResize;

			return chart;
		};
	}, []);

	return (
		<iframe
			ref={ref}
			key={srcDoc}
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
				<BrowserOnly>{() => <Chart script={props.children} />}</BrowserOnly>
			</>
	);
	}

	return <CodeBlock {...props} />;
};

// eslint-disable-next-line import/no-default-export
export default ChartCodeBlock;
