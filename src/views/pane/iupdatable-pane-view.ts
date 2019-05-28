import { IPaneView } from './ipane-view';

export type UpdateType = 'data' | 'other';

export interface IUpdatablePaneView extends IPaneView {
	update(updateType?: UpdateType): void;
}
