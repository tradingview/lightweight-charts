import { ensureNotNull } from '../helpers/assertions';

import { ZOrdered } from './idata-source';

export function sortSources<T extends ZOrdered>(sources: readonly T[]): T[] {
	return sources.slice().sort((s1: ZOrdered, s2: ZOrdered) => {
		return (ensureNotNull(s1.zorder()) - ensureNotNull(s2.zorder()));
	});
}
