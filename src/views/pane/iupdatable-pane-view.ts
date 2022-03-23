import { IPaneView } from './ipane-view';

export type UpdateType = 'data' | 'other' | 'options';

export interface IUpdatablePaneView extends IPaneView {
	update(updateType?: UpdateType): void;
}
