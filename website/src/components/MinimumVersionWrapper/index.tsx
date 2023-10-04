import { type PropVersionMetadata } from '@docusaurus/plugin-content-docs';
import { useDocsPreferredVersion } from '@docusaurus/theme-common';
import * as React from 'react';

import versions from '../../../versions.json';

interface MinimumVersionWrapperProps {
	version: number;
	fallback: React.FunctionComponent;
}

export default function MinimumVersionWrapper(props: React.PropsWithChildren<MinimumVersionWrapperProps>): ReturnType<React.FunctionComponent> {
	const { preferredVersion } = useDocsPreferredVersion() as { preferredVersion: (PropVersionMetadata & { name: string }) | null };
	const currentVersion = versions && versions.length > 0 ? versions[0] : '';
	const version = (preferredVersion?.name ?? currentVersion ?? 'current');

	const canShowExamples = version === 'current' || parseFloat(version) >= props.version;

	if (canShowExamples) {
		return props.children as React.ReactElement;
	} else {
		return props.fallback({});
	}
}
