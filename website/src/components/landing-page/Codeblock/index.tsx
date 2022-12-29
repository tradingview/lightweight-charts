import React from 'react';

import styles from './index.module.css';

export interface CodeBlockProps {
	startLineNumber?: number;
	canCopy?: boolean;
	canSelect?: boolean;
	lines: JSX.Element[];
	lineNumberOverrides?: string[];
	style: {
		height?: number | string;
		width?: number | string;
		left?: number | string;
		top?: number | string;
		bottom?: number | string;
		right?: number | string;
		transformOrigin: string;
	};
	name: string; // used for css rules to hide blocks at certain breakpoints
}

export default function LandingPageCodeBlock(
	props: CodeBlockProps
): JSX.Element {
	const startNumber = props.startLineNumber ?? 1;
	return (
		<aside
			className={styles.Block}
			data-can-select={props.canSelect}
			data-can-copy={props.canCopy}
			data-name={props.name}
			style={{ ...props.style }}
		>
			<div className={styles.BlockContent}>
				{props.lines.map((line: JSX.Element, index: number) => (
					<div key={index} className={styles.Line}>
						<div className={styles.LineNumber}>
							{props.lineNumberOverrides &&
							props.lineNumberOverrides.length > index
								? props.lineNumberOverrides[index]
								: index + startNumber}
						</div>
						{line}
					</div>
				))}
			</div>
		</aside>
	);
}
