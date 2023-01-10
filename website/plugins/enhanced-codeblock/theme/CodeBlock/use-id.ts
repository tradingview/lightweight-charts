import { useEffect, useState } from 'react';

const randomId = () => `${Math.random().toString(36).slice(2, 11)}`;

function useClientId(): string {
	const [uuid, setUuid] = useState('');
	useEffect(() => setUuid(randomId()), []);

	return uuid;
}

export function useId(staticId?: string): string {
	return typeof staticId === 'string' ? staticId : useClientId();
}
