// Embeds a plugin-examples page as a clean, chart-only iframe.
// The example pages are same-origin, so on load we inject a small stylesheet
// that hides the page's own title/description, removes scrolling, and lets
// the chart (created with autoSize: true) fill the frame. In production this
// would be an "embed mode" of the plugin-examples build instead.
import useBaseUrl from '@docusaurus/useBaseUrl';
import React, { useCallback, useRef, useState } from 'react';

import styles from './styles.module.css';

interface PluginExampleProps {
	id: string;
	name?: string;
	height?: number;
	/** Render without the border/radius, for embedding inside an existing frame. */
	bare?: boolean;
	/** Called when the gallery has no page for this id (the iframe hit a 404). */
	onMissing?: () => void;
}

export default function PluginExample({
	id,
	name,
	height = 330,
	bare = false,
	onMissing,
}: PluginExampleProps): React.JSX.Element {
	const ref = useRef<HTMLIFrameElement>(null);
	const src = useBaseUrl(`/plugin-examples/plugins/${id}/example/index.html`);

	const [missing, setMissing] = useState(false);

	const embed = (): void => {
		const doc = ref.current?.contentDocument;
		if (!doc) {
			return;
		}
		// The gallery page is same-origin; a slug without a deployed example
		// lands on the site's 404 page — hide the frame instead of showing it.
		if (doc.title.toLowerCase().includes('not found')) {
			setMissing(true);
			onMissing?.();
			return;
		}
		if (doc.getElementById('lwc-embed-style')) {
			return;
		}
		const style = doc.createElement('style');
		style.id = 'lwc-embed-style';
		style.textContent = [
			'body { margin: 0; padding: 10px; box-sizing: border-box; height: 100vh;',
			'  overflow: hidden; background: transparent;',
			'  display: flex; flex-direction: column; gap: 8px; }',
			'#description { display: none; }',
			'#chart, .column { max-width: none; width: auto; margin: 0; }',
			'#chart { flex: 1 1 auto; height: auto; min-height: 0; }',
		].join('\n');
		doc.head.appendChild(style);
	};
	const onLoad = useCallback(embed, []);

	if (missing) {
		return <></>;
	}

	return (
		<iframe
			ref={ref}
			src={src}
			title={`${name ?? id} — interactive example`}
			className={bare ? styles.frameBare : styles.frame}
			style={{ height }}
			loading="lazy"
			onLoad={onLoad}
		/>
	);
}
