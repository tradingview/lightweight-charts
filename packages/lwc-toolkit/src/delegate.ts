export type Callback<T1 = void> = (param1: T1) => void;

export interface ISubscription<T1 = void> {
	subscribe(
		callback: Callback<T1>,
		linkedObject?: unknown,
		singleshot?: boolean
	): void;
	unsubscribe(callback: Callback<T1>): void;
	unsubscribeAll(linkedObject: unknown): void;
}

interface Listener<T1> {
	callback: Callback<T1>;
	linkedObject?: unknown;
	singleshot: boolean;
}

export class Delegate<T1 = void> implements ISubscription<T1> {
	private _listeners: Listener<T1>[] = [];

	public subscribe(
		callback: Callback<T1>,
		linkedObject?: unknown,
		singleshot?: boolean
	): void {
		const listener: Listener<T1> = {
			callback,
			linkedObject,
			singleshot: singleshot === true,
		};
		this._listeners.push(listener);
	}

	public unsubscribe(callback: Callback<T1>): void {
		const index = this._listeners.findIndex(
			(listener: Listener<T1>) => callback === listener.callback
		);
		if (index > -1) {
			this._listeners.splice(index, 1);
		}
	}

	public unsubscribeAll(linkedObject: unknown): void {
		this._listeners = this._listeners.filter(
			(listener: Listener<T1>) => listener.linkedObject !== linkedObject
		);
	}

	public fire(param1: T1): void {
		const listenersSnapshot = [...this._listeners];
		this._listeners = this._listeners.filter(
			(listener: Listener<T1>) => !listener.singleshot
		);
		listenersSnapshot.forEach((listener: Listener<T1>) =>
			listener.callback(param1)
		);
	}

	public hasListeners(): boolean {
		return this._listeners.length > 0;
	}

	public destroy(): void {
		this._listeners = [];
	}
}
