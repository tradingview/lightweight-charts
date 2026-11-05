// Page of the examples docs instance (its `docItemComponent`). The content is
// still MDX in `examples/`, so search and the Markdown export work as for any
// doc; only the frame around it follows the plugin catalog: the index is the
// catalog grid, an example page is laid out like a plugin's detail page.
import Link from '@docusaurus/Link';
import { DocProvider, useDoc } from '@docusaurus/plugin-content-docs/client';
import { HtmlClassNameProvider, useWindowSize } from '@docusaurus/theme-common';
import type { Props } from '@theme/DocItem';
import DocItemMetadata from '@theme/DocItem/Metadata';
import MDXContent from '@theme/MDXContent';
import TOC from '@theme/TOC';
import TOCCollapsible from '@theme/TOCCollapsible';
import React from 'react';

import catalogStyles from '../../pages/plugins/styles.module.css';
import { useExampleCategoryLabel } from '../ExamplesGallery/categories';
import styles from './styles.module.css';

function ExamplePage({ children }: React.PropsWithChildren): React.JSX.Element {
	const { metadata, frontMatter, toc: contentToc } = useDoc();
	// Every example opens with its live chart and a "Code" section, which the
	// example block renders itself, so the heading is not in the MDX's own TOC.
	const toc = [{ value: 'Code', id: 'code', level: 2 }, ...contentToc];
	const category = useExampleCategoryLabel(metadata.id);
	// The same split as a plugin's page and DocItem/Layout: the TOC beside the
	// article on desktop (and in the server render, so it is in the HTML), the
	// collapsible one above it on mobile.
	const windowSize = useWindowSize();
	const hasToc = toc.length > 0 && !frontMatter.hide_table_of_contents;
	const showSidebarToc = hasToc && (windowSize === 'desktop' || windowSize === 'ssr');
	const showCollapsibleToc = hasToc && windowSize === 'mobile';
	const minHeadingLevel = frontMatter.toc_min_heading_level ?? 2;
	const maxHeadingLevel = frontMatter.toc_max_heading_level ?? 3;
	return (
		<main className={catalogStyles.detail}>
			<Link className={catalogStyles.backLink} to="/examples">
				&larr; Back to examples
			</Link>
			<header className={catalogStyles.detailHeader}>
				<h1>{metadata.title}</h1>
				{category && (
					<div className={catalogStyles.badgesRow}>
						<span className={catalogStyles.tag}>{category}</span>
					</div>
				)}
				{metadata.description && <p className={catalogStyles.detailDesc}>{metadata.description}</p>}
			</header>
			<div className="row">
				<div className={`col ${catalogStyles.detailBody}`}>
					{showCollapsibleToc && (
						<TOCCollapsible
							toc={toc}
							minHeadingLevel={minHeadingLevel}
							maxHeadingLevel={maxHeadingLevel}
							className={catalogStyles.tocMobile}
						/>
					)}
					<div className={`markdown ${styles.body}`}>
						<MDXContent>{children}</MDXContent>
					</div>
				</div>
				{showSidebarToc && (
					<div className="col col--3">
						<TOC
							toc={toc}
							minHeadingLevel={minHeadingLevel}
							maxHeadingLevel={maxHeadingLevel}
							className={catalogStyles.tocDesktop}
						/>
					</div>
				)}
			</div>
		</main>
	);
}

export default function ExampleItem(props: Props): React.JSX.Element {
	const MDXComponent = props.content;
	const isIndex = props.content.metadata.id === 'index';
	return (
		<DocProvider content={props.content}>
			<HtmlClassNameProvider className={`docs-doc-id-${props.content.metadata.id}`}>
				<DocItemMetadata />
				{isIndex ? (
					<MDXContent>
						<MDXComponent />
					</MDXContent>
				) : (
					<ExamplePage>
						<MDXComponent />
					</ExamplePage>
				)}
			</HtmlClassNameProvider>
		</DocProvider>
	);
}
