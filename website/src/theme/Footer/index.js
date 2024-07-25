import React from 'react';
import Footer from '@theme-original/Footer';
import AnalyticsWrapper from '../analytics-wrapper';

// eslint-disable-next-line import/no-default-export
export default function FooterWrapper(props) {
	return (
		<AnalyticsWrapper>
			<Footer {...props} />
		</AnalyticsWrapper>
	);
}
