import * as React from 'react';
import CodeBlock from '@theme-init/CodeBlock';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';

import { Chart } from './chart';

import styles from './styles.module.css';
import './hidden-lines-styles.css';

import { themeColors } from '../../../../theme-colors';
import { useId } from './use-id';

const variableNames = Object.keys(themeColors.DARK);

export function replaceThemeConstantStrings(originalString, isDarkTheme) {
	const colors = isDarkTheme ? themeColors.DARK : themeColors.LIGHT;

	let result = originalString;
	for (const name of variableNames) {
		result = result.replace(new RegExp(name, 'g'), `'${colors[name]}'`);
	}

	return result;
}

export function removeUnwantedLines(originalString) {
	return originalString.replace(new RegExp(/\/\/ delete-start[\w\W]*?\/\/ delete-end/, 'gm'), '');
}

const EnhancedCodeBlock = props => {
	const { chart, replaceThemeConstants, hideableCode, chartOnly, iframeStyle, ...rest } = props;
	let { children } = props;
	const { colorMode } = useColorMode();
	const isDarkTheme = colorMode === 'dark';
	const uniqueId = useId();

	if (replaceThemeConstants && typeof children === 'string') {
		children = replaceThemeConstantStrings(children, isDarkTheme);
	}
	children = removeUnwantedLines(children);

	if (chart || hideableCode) {
		return (
			<>
				{hideableCode && <>
					<input
						id={uniqueId}
						type="checkbox"
						className="toggle-hidden-lines"
					/>
					<label className="toggle-label" htmlFor={uniqueId}>Show all code</label></>}
				{!chartOnly && <CodeBlock {...rest}>{children}</CodeBlock>}
				{chart && <BrowserOnly fallback={<div className={styles.iframe}>&nbsp;</div>}>{() => <Chart script={children} iframeStyle={iframeStyle} />}</BrowserOnly>}
			</>
		);
	}

	return <CodeBlock {...rest}>{children}</CodeBlock>;
};

export default EnhancedCodeBlock;
