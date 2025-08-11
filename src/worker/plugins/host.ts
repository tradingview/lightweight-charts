import { WorkerPlugin, WorkerPluginContext, WorkerPluginInstanceId, WorkerRenderContexts, WorkerRenderSizes } from './types';

export class WorkerPluginHost {
	private readonly _model: unknown;
	private readonly _requestRender: (overlayOnly?: boolean) => void;

	private _instances: Map<WorkerPluginInstanceId, { plugin: WorkerPlugin<unknown>; options: unknown }> = new Map<WorkerPluginInstanceId, { plugin: WorkerPlugin<unknown>; options: unknown }>();
	private _sizes: WorkerRenderSizes;
	private _contexts: WorkerRenderContexts;

	public constructor(model: unknown, requestRender: (overlayOnly?: boolean) => void, sizes: WorkerRenderSizes, contexts: WorkerRenderContexts) {
		this._model = model;
		this._requestRender = requestRender;
		this._sizes = sizes;
		this._contexts = contexts;
	}

	public setSizes(sizes: WorkerRenderSizes): void { this._sizes = sizes; }
	public setContexts(contexts: WorkerRenderContexts): void { this._contexts = contexts; }

	public register(id: WorkerPluginInstanceId, plugin: WorkerPlugin<unknown>, options: unknown): void {
		if (this._instances.has(id)) { return; }
		this._instances.set(id, { plugin, options });
		try { plugin.onInit?.(this._ctx(), options); } catch { /* ignore plugin errors */ }
	}

	public unregister(id: WorkerPluginInstanceId): void {
		const inst = this._instances.get(id);
		if (!inst) { return; }
		try { inst.plugin.onDestroy?.(); } catch { /* ignore */ }
		this._instances.delete(id);
	}

	public applyOptions(id: WorkerPluginInstanceId, options: unknown): void {
		const inst = this._instances.get(id);
		if (!inst) { return; }
		try { inst.plugin.applyOptions?.(options as Partial<unknown>); } catch { /* ignore */ }
	}

	public onResize(): void {
		const ctx = this._ctx();
		for (const { plugin } of this._instances.values()) {
			try { plugin.onResize?.(ctx); } catch { /* ignore */ }
		}
	}

	public renderPane(): void {
		const ctx = this._ctx();
		for (const { plugin } of this._instances.values()) {
			try { plugin.onRenderPane?.(ctx); } catch { /* ignore */ }
		}
	}

	public renderOverlay(): void {
		const ctx = this._ctx();
		for (const { plugin } of this._instances.values()) {
			try { plugin.onRenderOverlay?.(ctx); } catch { /* ignore */ }
		}
	}

	public renderTimeAxis(): void {
		const ctx = this._ctx();
		for (const { plugin } of this._instances.values()) {
			try { plugin.onRenderTimeAxis?.(ctx); } catch { /* ignore */ }
		}
	}

	public renderRightAxis(): void {
		const ctx = this._ctx();
		for (const { plugin } of this._instances.values()) {
			try { plugin.onRenderRightAxis?.(ctx); } catch { /* ignore */ }
		}
	}

	private _ctx(): WorkerPluginContext {
		return {
			model: this._model,
			sizes: this._sizes,
			contexts: this._contexts,
			requestRender: this._requestRender,
		};
	}
}

