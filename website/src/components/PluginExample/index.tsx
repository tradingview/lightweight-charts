// Frames one of a plugin package's own pages — the catalogue preview
// (`lwcPlugin.preview`) or the full demo (`lwcPlugin.demo`) — both built into
// the site by `pnpm plugins:build-demos`.
//
// The page is self-contained: it carries its own light `color-scheme`, its own
// background and a layout that fills whatever frame it is given. Nothing is
// restyled after load, which is what used to make the chart jump — it was
// created at the page's own fixed height and only resized once the injected
// stylesheet landed.
import useBaseUrl from '@docusaurus/useBaseUrl';
import React from 'react';

import styles from './styles.module.css';

interface PluginExampleProps {
	/** Site-root-relative URL of the page to frame, from the catalogue entry. */
	url: string;
	name?: string;
	height?: number;
	/** Render without the border/radius, for embedding inside an existing frame. */
	bare?: boolean;
}

export default function PluginExample({
	url,
	name,
	height = 330,
	bare = false,
}: PluginExampleProps): React.JSX.Element {
	const src = useBaseUrl(url);

	return (
		<iframe
			src={src}
			title={`${name ?? 'Plugin'} — interactive example`}
			className={bare ? styles.frameBare : styles.frame}
			style={{ height }}
			loading="lazy"
		/>
	);
}
