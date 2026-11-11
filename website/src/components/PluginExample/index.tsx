// Frames one of a plugin package's own pages — the catalogue preview
// (`lwcPlugin.preview`) or the full demo (`lwcPlugin.demo`) — both built into
// the site by `pnpm plugins:build-demos`.
//
// The page is self-contained: it carries its own background and a layout that
// fills whatever frame it is given. Nothing is restyled after load, which is
// what used to make the chart jump — it was created at the page's own fixed
// height and only resized once the injected stylesheet landed.
//
// A preview also follows the site's light/dark theme by itself: the preview kit
// reads this page's `data-theme` through the same-origin frame and keeps
// watching it, so a theme toggle restyles the running preview without reloading
// it. A demo stays light.
import useBaseUrl from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import React from 'react';

import styles from './styles.module.css';

interface PluginExampleProps {
	/** Site-root-relative URL of the page to frame, from the catalogue entry. */
	url: string;
	name?: string;
	height?: number;
	/** Render without the border/radius, for embedding inside an existing frame. */
	bare?: boolean;
	/** The framed page follows the site theme, so its placeholder does too. */
	themed?: boolean;
}

export default function PluginExample({
	url,
	name,
	height = 330,
	bare = false,
	themed = false,
}: PluginExampleProps): React.JSX.Element {
	const src = useBaseUrl(url);

	return (
		<iframe
			src={src}
			title={`${name ?? 'Plugin'} — interactive example`}
			className={clsx(bare ? styles.frameBare : styles.frame, themed && styles.themed)}
			style={{ height }}
			loading="lazy"
		/>
	);
}
