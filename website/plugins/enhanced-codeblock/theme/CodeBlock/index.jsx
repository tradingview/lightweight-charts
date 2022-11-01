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

const EnhancedCodeBlock = props => {
	const { chart, replaceThemeConstants, hideableCode, ...rest } = props;
	let { children } = props;
	const { colorMode } = useColorMode();
	const isDarkTheme = colorMode === 'dark';
	const uniqueId = useId();

	if (replaceThemeConstants && typeof children === 'string') {
		children = replaceThemeConstantStrings(children, isDarkTheme);
	}

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
				<CodeBlock {...rest}>{children}</CodeBlock>
				{chart && <BrowserOnly fallback={<div className={styles.iframe}>&nbsp;</div>}>{() => <Chart script={children} />}</BrowserOnly>}
			</>
		);
	}

	return <CodeBlock {...rest}>{children}</CodeBlock>;
};

export default EnhancedCodeBlock;
