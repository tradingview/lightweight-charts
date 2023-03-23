import { ensureNotNull } from '../helpers/assertions';

import { IDataSource } from './idata-source';

export function sortSources<HorzScaleItem, T extends IDataSource<HorzScaleItem>>(sources: readonly T[]): T[] {
	return sources.slice().sort((s1: IDataSource<HorzScaleItem>, s2: IDataSource<HorzScaleItem>) => {
		return (ensureNotNull(s1.zorder()) - ensureNotNull(s2.zorder()));
	});
}
