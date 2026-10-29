// Root of the examples docs instance (its `docRootComponent`). The theme's own
// DocRoot puts the docs sidebar beside every page; the examples are laid out
// like the plugin catalog instead, so the sidebar is left out. It is still
// provided, because the gallery reads its categories from it.
import { DocsSidebarProvider, useDocRootMetadata } from '@docusaurus/plugin-content-docs/client';
import { HtmlClassNameProvider, ThemeClassNames } from '@docusaurus/theme-common';
import type { Props } from '@theme/DocRoot';
import NotFoundContent from '@theme/NotFound/Content';
import React from 'react';

export default function ExamplesRoot(props: Props): React.JSX.Element {
	const metadata = useDocRootMetadata(props);
	if (!metadata) {
		return <NotFoundContent />;
	}
	const { docElement, sidebarName, sidebarItems } = metadata;
	return (
		<HtmlClassNameProvider className={ThemeClassNames.page.docsDocPage}>
			<DocsSidebarProvider name={sidebarName} items={sidebarItems}>
				{docElement}
			</DocsSidebarProvider>
		</HtmlClassNameProvider>
	);
}
