import React, { useEffect } from 'react';
import { useLocation } from '@docusaurus/router';
import { safeTrackPageView } from './analytics-tracker';

// eslint-disable-next-line react/prop-types
const AnalyticsWrapper = ({ children }) => {
	const location = useLocation();

	useEffect(() => {
		safeTrackPageView();
	}, [location]);

	return <>{children}</>;
};

// eslint-disable-next-line import/no-default-export
export default AnalyticsWrapper;
