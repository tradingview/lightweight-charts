import { type PropVersionMetadata } from '@docusaurus/plugin-content-docs';
import { useDocsPreferredVersion } from '@docusaurus/theme-common';
import Admonition from '@theme/Admonition';
import React from 'react';

import versions from '../../../versions.json';

interface Props {
	/** Message to show if not the latest released version */
	notCurrent?: string;
	/** Message to show if the latest released version */
	isCurrent?: string;
	type: 'note' | 'tip' | 'danger' | 'info' | 'caution';
	title?: string;
	/** Display a preformatted message about the versions at the bottom of the warning */
	displayVersionMessage?: boolean;
}

// Extend the type returned by useDocsPreferredVersion to include
// information populated by docusaurus plugins
type UseDocsPreferredVersion = Omit<
	ReturnType<typeof useDocsPreferredVersion>,
	'preferredVersion'
> & {
	preferredVersion: (PropVersionMetadata & { name: string }) | null;
};

export default function VersionWarningAdmonition({
	notCurrent,
	isCurrent,
	type,
	title,
	displayVersionMessage,
}: Props): JSX.Element {
	const { preferredVersion, savePreferredVersionName } =
		useDocsPreferredVersion() as UseDocsPreferredVersion;
	const notCurrentWarning = Boolean(notCurrent && !preferredVersion?.isLast);
	const isCurrentWarning = Boolean(isCurrent && preferredVersion?.isLast);

	const currentVersion = versions && versions.length > 0 ? versions[0] : '';
	const docVersion = preferredVersion?.label ?? preferredVersion?.name ?? '';

	if ((!notCurrentWarning && !isCurrentWarning) || !docVersion) {
		return <></>;
	}

	let message = (notCurrentWarning ? notCurrent : isCurrent) ?? '';
	message = message
		.replace(/DOC_VERSION/g, docVersion)
		.replace(/CURRENT_VERSION/g, currentVersion);

	return (
		<div>
			<Admonition type={type} title={title}>
				<p>{message}</p>
				{displayVersionMessage && (
					<p>
						You are currently viewing the documentation for the version tagged:{' '}
						<strong>{docVersion}</strong>. <br />
						<strong>
							<a
								href=""
								onClick={() => savePreferredVersionName(currentVersion)}
							>
								Switch to the latest published version
							</a>
						</strong>{' '}
						({currentVersion})
					</p>
				)}
			</Admonition>
		</div>
	);
}
