"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delegate = void 0;
class Delegate {
    constructor() {
        this._listeners = [];
    }
    subscribe(callback, linkedObject, singleshot) {
        const listener = {
            callback,
            linkedObject,
            singleshot: singleshot === true,
        };
        this._listeners.push(listener);
    }
    unsubscribe(callback) {
        const index = this._listeners.findIndex((listener) => callback === listener.callback);
        if (index > -1) {
            this._listeners.splice(index, 1);
        }
    }
    unsubscribeAll(linkedObject) {
        this._listeners = this._listeners.filter((listener) => listener.linkedObject !== linkedObject);
    }
    fire(param1, param2, param3) {
        const listenersSnapshot = [...this._listeners];
        this._listeners = this._listeners.filter((listener) => !listener.singleshot);
        listenersSnapshot.forEach((listener) => listener.callback(param1, param2, param3));
    }
    hasListeners() {
        return this._listeners.length > 0;
    }
    destroy() {
        this._listeners = [];
    }
}
exports.Delegate = Delegate;
