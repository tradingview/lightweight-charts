import { Callback, ISubscription } from './isubscription';
export declare class Delegate<T1 = void, T2 = void, T3 = void> implements ISubscription<T1, T2, T3> {
    private _listeners;
    subscribe(callback: Callback<T1, T2, T3>, linkedObject?: unknown, singleshot?: boolean): void;
    unsubscribe(callback: Callback<T1, T2, T3>): void;
    unsubscribeAll(linkedObject: unknown): void;
    fire(param1: T1, param2: T2, param3: T3): void;
    hasListeners(): boolean;
    destroy(): void;
}
