import React from 'react';

import styles from './codeblock.module.css';

export interface CodeBlockProps {
	startLineNumber?: number;
	canCopy?: boolean;
	canSelect?: boolean;
	lines: React.JSX.Element[];
	lineNumberOverrides?: string[];
	style: {
		height?: number | string;
		width?: number | string;
		left?: number | string;
		top?: number | string;
		bottom?: number | string;
		right?: number | string;
		transformOrigin: string;
		maxWidth?: number | string;
	};
	name: string; // used for css rules to hide blocks at certain breakpoints
}

export default function LandingPageCodeBlock(
	props: CodeBlockProps
): React.JSX.Element {
	const {
		canSelect,
		canCopy,
		name,
		style,
		startLineNumber,
		lines,
		lineNumberOverrides,
	} = props;
	const startNumber = startLineNumber ?? 1;
	return (
		<aside
			className={styles.Block}
			data-can-select={canSelect}
			data-can-copy={canCopy}
			data-name={name}
			style={{ ...style }}
		>
			<div className={styles.BlockContent}>
				{lines.map((line: React.JSX.Element, index: number) => (
					<div key={index} className={styles.Line}>
						<div className={styles.LineNumber}>
							{lineNumberOverrides && lineNumberOverrides.length > index
								? lineNumberOverrides[index]
								: index + startNumber}
						</div>
						{line}
					</div>
				))}
			</div>
		</aside>
	);
}
