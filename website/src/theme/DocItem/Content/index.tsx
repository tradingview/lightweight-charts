import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { ThemeClassNames } from '@docusaurus/theme-common';
import type { Props } from '@theme/DocItem/Content';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import clsx from 'clsx';
import React from 'react';

import { MarkdownActions, MarkdownActionsInContentProvider } from './markdown-actions';

/**
 * Title can be declared inside md content or declared through front matter and
 * added manually. To make both cases consistent, the added title is added under
 * the same div.markdown block.
 *
 * We render a "synthetic title" if:
 * - user doesn't ask to hide it with front matter
 * - the markdown content does not already contain a top-level h1 heading
 */
function useSyntheticTitle(): string | null {
	const { metadata, frontMatter, contentTitle } = useDoc();
	const shouldRender = !frontMatter.hide_title && contentTitle === undefined;
	if (!shouldRender) {
		return null;
	}
	return metadata.title;
}

// Swizzled from theme-classic to render a Markdown actions row (Copy/View as
// Markdown) directly under the page title.
//
// Where that is depends on the page: a title set in the front matter is the
// synthetic one rendered here, and the row follows it. A title written as
// `# Title` in the Markdown itself is rendered from within MDXContent, out of
// reach from here, so on those pages the row is emitted by the swizzled `h1`
// instead — the provider is what hands it that job.
export default function DocItemContent({ children }: Props): React.JSX.Element {
	const { contentTitle } = useDoc();
	const syntheticTitle = useSyntheticTitle();
	return (
		<div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
			{syntheticTitle !== null && (
				<>
					<header>
						<Heading as="h1">{syntheticTitle}</Heading>
					</header>
					<MarkdownActions />
				</>
			)}
			<MarkdownActionsInContentProvider title={syntheticTitle === null ? contentTitle ?? null : null}>
				<MDXContent>{children}</MDXContent>
			</MarkdownActionsInContentProvider>
		</div>
	);
}
