import { useDoc, useDocsVersion } from '@docusaurus/plugin-content-docs/client';
import clsx from 'clsx';
import React, { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import styles from './styles.module.css';

// How long the "Copied" confirmation stays before reverting to the idle label.
const RESET_DELAY_MS = 2000;

type CopyStatus = 'idle' | 'copied' | 'failed';

// The labels share one grid cell so the button keeps the width of its widest
// label: only the text crossfades, the row never jumps.
const COPY_LABELS: Record<CopyStatus, string> = {
	idle: 'Copy as Markdown',
	copied: 'Copied',
	failed: 'Copy failed',
};

/*
 * The title a page renders from its own Markdown, on the pages that do.
 *
 * The actions row belongs directly under the page title, but the title comes
 * from one of two places: the theme renders it when it is set in the front
 * matter, and the page's own Markdown renders it when it is written as
 * `# Title` there. This is what tells the swizzled `h1` (see
 * theme/MDXComponents) that the row is its job, and under which heading.
 */
const MarkdownActionsInContentContext = createContext<string | null>(null);

export function MarkdownActionsInContentProvider({ title, children }: { title: string | null; children: ReactNode }): React.JSX.Element {
	return <MarkdownActionsInContentContext.Provider value={title}>{children}</MarkdownActionsInContentContext.Provider>;
}

export function useMarkdownActionsInContent(): string | null {
	return useContext(MarkdownActionsInContentContext);
}

function CopyIcon(): React.JSX.Element {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden={true}>
			<rect x="9" y="9" width="12" height="12" rx="2" />
			<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
		</svg>
	);
}

function CheckIcon(): React.JSX.Element {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden={true}>
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}

/*
 * A row of flat links under the page title: copy the page as Markdown (fetches
 * the sibling `.md` the docs-markdown plugin emits) and open that `.md` itself.
 *
 * Only the pages that plugin exports have a `.md`, so the row is hidden on the
 * generated API reference and on any version other than the released one.
 */
export function MarkdownActions(): React.JSX.Element | null {
	const { metadata } = useDoc();
	const { isLast } = useDocsVersion();
	const [status, setStatus] = useState<CopyStatus>('idle');
	const resetTimeout = useRef<number | undefined>(undefined);

	// The plugin writes each page's Markdown next to its route (`<permalink>.md`),
	// and permalink already carries the site baseUrl, so this resolves correctly
	// on local, staging and production builds alike.
	const markdownUrl = `${metadata.permalink.replace(/\/$/, '')}.md`;

	useEffect(() => (): void => window.clearTimeout(resetTimeout.current), []);

	const copyMarkdown = useCallback(
		async (): Promise<void> => {
			const report = (result: CopyStatus): void => {
				setStatus(result);
				window.clearTimeout(resetTimeout.current);
				resetTimeout.current = window.setTimeout(() => setStatus('idle'), RESET_DELAY_MS);
			};

			try {
				const response = await window.fetch(markdownUrl);
				const contentType = response.headers.get('content-type') ?? '';
				if (!response.ok || contentType.includes('html')) {
					throw new Error(`Markdown not available (status ${response.status})`);
				}
				const markdown = await response.text();
				// The dev server (and any SPA fallback) answers unknown routes with
				// the app shell HTML, not the .md — never put that on the clipboard.
				if (/^\s*<(?:!doctype|html)\b/i.test(markdown)) {
					throw new Error('Received HTML instead of Markdown');
				}
				await window.navigator.clipboard.writeText(markdown);
				report('copied');
			} catch {
				// If the file or the clipboard is unavailable, fall back to copying
				// the Markdown URL so the action still does something useful.
				try {
					await window.navigator.clipboard.writeText(`${window.location.origin}${markdownUrl}`);
					report('copied');
				} catch {
					// No clipboard at all (an insecure context, say). Say so, rather
					// than leaving a button that looks like it does nothing.
					report('failed');
				}
			}
		},
		[markdownUrl]
	);

	const onCopy = useCallback(
		(): void => {
			void copyMarkdown();
		},
		[copyMarkdown]
	);

	if (!isLast || metadata.permalink.split('/').includes('api')) {
		return null;
	}

	return (
		<div className={styles.actions}>
			<button
				type="button"
				className={styles.action}
				data-status={status}
				data-tooltip="Copy this page as Markdown for LLMs"
				onClick={onCopy}
			>
				{status === 'copied' ? <CheckIcon /> : <CopyIcon />}
				<span className={styles.label}>
					{Object.entries(COPY_LABELS).map(([value, text]: [string, string]) => (
						<span key={value} data-active={status === value} aria-hidden={status !== value}>{text}</span>
					))}
				</span>
			</button>
			<span className={styles.divider} aria-hidden={true} />
			<a
				className={clsx(styles.action, styles.view)}
				href={markdownUrl}
				target="_blank"
				rel="noopener noreferrer"
				data-tooltip="View this page as plain text"
			>
				<span className={styles.badge} aria-hidden={true}>M↓</span>
				<span>View as Markdown</span>
			</a>
		</div>
	);
}
