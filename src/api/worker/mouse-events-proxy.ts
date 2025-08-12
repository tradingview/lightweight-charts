export class MouseEventsProxy {
	private readonly _element: HTMLElement;
	private readonly _worker: Worker;

	private _boundWheel: (ev: WheelEvent) => void;
	private _boundDown: (ev: MouseEvent) => void;
	private _boundMove: (ev: MouseEvent) => void;
	private _boundUp: (ev: MouseEvent) => void;
	private _boundDbl: (ev: MouseEvent) => void;
	private _boundHover: (ev: MouseEvent) => void;
	private _boundLeave: (ev: MouseEvent) => void;
	private _boundTouchStart: (ev: TouchEvent) => void;
	private _boundTouchMove: (ev: TouchEvent) => void;
	private _boundTouchEnd: (ev: TouchEvent) => void;
	private _pinchActive: boolean = false;
	private _pinchStartDistance: number = 0;
	private _pinchStartX: number = 0;

	// rAF-based batching state
	private _rafId: number | null = null;
	private _wheelQueued: boolean = false;
	private _wheelDX: number = 0;
	private _wheelDY: number = 0;
	private _wheelMode: number = 0;
	private _wheelX: number = 0;
	private _dragQueued: boolean = false;
	private _dragX: number = 0;
	private _hoverQueued: boolean = false;
	private _hoverX: number = 0;
	private _hoverY: number = 0;
	private _pinchQueued: boolean = false;
	private _pinchX: number = 0;
	private _pinchScale: number = 1;

	public constructor(element: HTMLElement, worker: Worker) {
		this._element = element;
		this._worker = worker;

		this._boundWheel = this._onWheel.bind(this);
		this._boundDown = this._onMouseDown.bind(this);
		this._boundMove = this._onMouseMove.bind(this);
		this._boundUp = this._onMouseUp.bind(this);
		this._boundDbl = this._onDblClick.bind(this);
		this._boundHover = this._onHoverMove.bind(this);
		this._boundLeave = this._onHoverLeave.bind(this);
		this._boundTouchStart = this._onTouchStart.bind(this);
		this._boundTouchMove = this._onTouchMove.bind(this);
		this._boundTouchEnd = this._onTouchEnd.bind(this);

		element.addEventListener('wheel', this._boundWheel, { passive: false });
		element.addEventListener('mousedown', this._boundDown);
		element.addEventListener('dblclick', this._boundDbl);
		element.addEventListener('mousemove', this._boundHover);
		element.addEventListener('mouseleave', this._boundLeave);
		element.addEventListener('touchstart', this._boundTouchStart, { passive: true });
		element.addEventListener('touchmove', this._boundTouchMove, { passive: false });
		element.addEventListener('touchend', this._boundTouchEnd, { passive: true });
	}

	public destroy(): void {
		this._element.removeEventListener('wheel', this._boundWheel as EventListener);
		this._element.removeEventListener('mousedown', this._boundDown as EventListener);
		document.removeEventListener('mousemove', this._boundMove as EventListener);
		document.removeEventListener('mouseup', this._boundUp as EventListener);
		this._element.removeEventListener('dblclick', this._boundDbl as EventListener);
		this._element.removeEventListener('mousemove', this._boundHover as EventListener);
		this._element.removeEventListener('mouseleave', this._boundLeave as EventListener);
		this._element.removeEventListener('touchstart', this._boundTouchStart as EventListener);
		this._element.removeEventListener('touchmove', this._boundTouchMove as EventListener);
		this._element.removeEventListener('touchend', this._boundTouchEnd as EventListener);
	}

	private _getLocalX(ev: MouseEvent | WheelEvent): number {
		const r = this._element.getBoundingClientRect();
		return ev.clientX - r.left;
	}

	private _onWheel(ev: WheelEvent): void {
		if (ev.cancelable) {ev.preventDefault();}
		this._wheelQueued = true;
		this._wheelDX += ev.deltaX;
		this._wheelDY += ev.deltaY;
		this._wheelMode = ev.deltaMode;
		this._wheelX = this._getLocalX(ev);
		this._scheduleFlush();
	}

	private _onMouseDown(ev: MouseEvent): void {
		const x = this._getLocalX(ev);
		this._worker.postMessage({ type: 'pointerDown', x });
		document.addEventListener('mousemove', this._boundMove);
		document.addEventListener('mouseup', this._boundUp, { once: true });
	}

	private _onMouseMove(ev: MouseEvent): void {
		this._dragQueued = true;
		this._dragX = this._getLocalX(ev);
		this._scheduleFlush();
	}

	private _onMouseUp(ev: MouseEvent): void {
		const x = this._getLocalX(ev);
		this._worker.postMessage({ type: 'pointerUp', x });
		document.removeEventListener('mousemove', this._boundMove);
	}

	private _onDblClick(ev: MouseEvent): void {
		this._worker.postMessage({ type: 'dblClick' });
	}

	private _onHoverMove(ev: MouseEvent): void {
		const r = this._element.getBoundingClientRect();
		this._hoverQueued = true;
		this._hoverX = ev.clientX - r.left;
		this._hoverY = ev.clientY - r.top;
		this._scheduleFlush();
	}

	private _onHoverLeave(ev: MouseEvent): void {
		this._worker.postMessage({ type: 'hoverLeave' });
	}

	private _onTouchStart(ev: TouchEvent): void {
		if (ev.touches.length === 2) {
			this._pinchActive = true;
			const [t0, t1] = [ev.touches[0], ev.touches[1]];
			const r = this._element.getBoundingClientRect();
			this._pinchStartDistance = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
			this._pinchStartX = ((t0.clientX - r.left) + (t1.clientX - r.left)) / 2;
			this._worker.postMessage({ type: 'pinchStart', x: this._pinchStartX });
			return;
		}
		const t = ev.touches[0];
		const x = this._getLocalX(t as unknown as MouseEvent);
		this._worker.postMessage({ type: 'pointerDown', x });
	}

	private _onTouchMove(ev: TouchEvent): void {
		if (this._pinchActive && ev.touches.length === 2) {
			if (ev.cancelable) {ev.preventDefault();}
			const [t0, t1] = [ev.touches[0], ev.touches[1]];
			const r = this._element.getBoundingClientRect();
			const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
			this._pinchScale = dist / Math.max(1, this._pinchStartDistance);
			this._pinchX = ((t0.clientX - r.left) + (t1.clientX - r.left)) / 2;
			this._pinchQueued = true;
			this._scheduleFlush();
			return;
		}
		const t = ev.touches[0];
		this._dragQueued = true;
		this._dragX = this._getLocalX(t as unknown as MouseEvent);
		this._scheduleFlush();
	}

	private _onTouchEnd(ev: TouchEvent): void {
		if (this._pinchActive) {
			this._pinchActive = false;
			this._worker.postMessage({ type: 'pinchEnd' });
			return;
		}
		this._worker.postMessage({ type: 'pointerUp' });
	}

	private _scheduleFlush(): void {
		if (this._rafId !== null) { return; }
		this._rafId = window.requestAnimationFrame(() => this._flush());
	}

	private _flush(): void {
		this._rafId = null;
		if (this._wheelQueued) {
			this._worker.postMessage({ type: 'wheel', deltaX: this._wheelDX, deltaY: this._wheelDY, deltaMode: this._wheelMode, x: this._wheelX });
			this._wheelQueued = false; this._wheelDX = 0; this._wheelDY = 0;
		}
		if (this._dragQueued) {
			this._worker.postMessage({ type: 'pointerMove', x: this._dragX });
			this._dragQueued = false;
		}
		if (this._hoverQueued) {
			this._worker.postMessage({ type: 'hoverMove', x: this._hoverX, y: this._hoverY });
			this._hoverQueued = false;
		}
		if (this._pinchQueued) {
			this._worker.postMessage({ type: 'pinch', x: this._pinchX, scale: this._pinchScale });
			this._pinchQueued = false;
		}
	}
}

