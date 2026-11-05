import { useDoc, useDocsVersion } from '@docusaurus/plugin-content-docs/client';
import { ThemeClassNames } from '@docusaurus/theme-common';
import type { Props } from '@theme/DocItem/Content';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import clsx from 'clsx';
import React from 'react';

import VersionWarningAdmonition from '../../../components/VersionWarningAdmonition';
import { MarkdownActions, MarkdownActionsInContentProvider } from './markdown-actions';

// The tutorials and examples aren't versioned: they always target the latest
// release. A reader who picked an older docs version gets a warning on every
// page of these sections, keyed by the docs plugin the page belongs to.
const UNVERSIONED_SECTION_WARNINGS: Record<string, string> = {
	tutorials: 'These tutorials are for the latest published version of Lightweight Charts.',
	examples: 'These examples are for the latest published version of Lightweight Charts.',
};

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
	const { pluginId } = useDocsVersion();
	const syntheticTitle = useSyntheticTitle();
	const versionWarning = UNVERSIONED_SECTION_WARNINGS[pluginId];
	return (
		<div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
			{versionWarning !== undefined && (
				<VersionWarningAdmonition notCurrent={versionWarning} type="caution" displayVersionMessage />
			)}
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
