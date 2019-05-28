import { ensureNotNull } from '../helpers/assertions';

import { IDataSource } from './idata-source';

export function sortSources(sources: ReadonlyArray<IDataSource>): IDataSource[] {
	return sources.slice().sort((s1: IDataSource, s2: IDataSource) => {
		return (ensureNotNull(s1.zorder()) - ensureNotNull(s2.zorder()));
	});
}
