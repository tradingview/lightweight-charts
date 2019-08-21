// tslint:disable-next-line:invalid-void
export type Callback<T1 = void, T2 = void> = (param1: T1, param2: T2) => void;

// tslint:disable-next-line:invalid-void
export interface ISubscription<T1 = void, T2 = void> {
	subscribe(callback: Callback<T1, T2>, linkedObject?: object, singleshot?: boolean): void;
	unsubscribe(callback: Callback<T1, T2>): void;
	unsubscribeAll(linkedObject: object): void;
}
