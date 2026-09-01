import OriginalMDXComponents from '@theme-original/MDXComponents';
import type { MDXComponentsObject } from '@theme/MDXComponents';
import React, { type ComponentProps, type ReactNode } from 'react';

import { MarkdownActions, useMarkdownActionsInContent } from '../DocItem/Content/markdown-actions';

const originalComponents = OriginalMDXComponents as MDXComponentsObject;

/**
 * The plain text of a heading, or null when it is built from something this
 * cannot read (an element, an expression). Headings are written as plain text
 * throughout the docs; the null case only keeps the check below honest.
 */
function headingText(children: ReactNode): string | null {
	if (typeof children === 'string') {
		return children;
	}
	if (!Array.isArray(children)) {
		return null;
	}
	const parts = children.map((child: ReactNode) => (typeof child === 'string' ? child : null));
	return parts.includes(null) ? null : parts.join('');
}

/*
 * A page whose title is written as `# Title` in its own Markdown renders that
 * heading from here rather than from the theme, so this is the only place the
 * Markdown actions row can be put directly under it. DocItem/Content decides
 * which of the two places is used, and only doc pages ever ask for this one.
 *
 * The row goes under the page's title, not under every `h1` it happens to
 * contain, so a heading that is demonstrably a different one is left alone.
 */
function Heading1(props: ComponentProps<'h1'>): React.JSX.Element {
	const pageTitle = useMarkdownActionsInContent();
	const text = headingText(props.children);
	const isPageTitle = pageTitle !== null && (text === null || text.trim() === pageTitle.trim());
	return (
		<>
			<originalComponents.h1 {...props} />
			{isPageTitle && <MarkdownActions />}
		</>
	);
}

export default {
	...originalComponents,
	h1: Heading1,
};
