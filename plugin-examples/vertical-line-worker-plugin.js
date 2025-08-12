// Vertical Line (worker-mode) plugin example
// Draws a vertical marker line at a given time with optional time-axis label

export function createVerticalLineWorkerPlugin(initialOptions = {}) {
	let options = {
		time: initialOptions.time ?? null, // unix seconds expected to match data time scale
		color: initialOptions.color || "green",
		width: typeof initialOptions.width === "number" ? initialOptions.width : 3,
		showLabel: !!initialOptions.showLabel,
		labelText: initialOptions.labelText || "",
		labelBackgroundColor: initialOptions.labelBackgroundColor || "green",
		labelTextColor: initialOptions.labelTextColor || "white",
	};

	function coordinateX(ctx) {
		console.log("coordinateX", ctx);
		const ts = ctx.model.timeScale?.();
		console.log("ts", ts);
		if (!ts) return null;
		// @TODO expose to the user correct timeScale class
		// current we exposing wrong class for timeScale so
		const timePointIndex = ts.timeToIndex(options.time, false);
		const x =
			typeof options.time === "number"
				? ts.indexToCoordinate(timePointIndex)
				: null;
		console.log("x", x);
		return typeof x === "number" && Number.isFinite(x) ? x : null;
	}

	return {
		onRenderPane(ctx) {
			console.log("onRenderPane", ctx);
			const base = ctx.contexts.pane;
			if (!base) return;
			const x = coordinateX(ctx);
			if (x === null) return;
			const dpr = ctx.sizes.devicePixelRatio || 1;
			base.save();
			try {
				if (typeof base.resetTransform === "function") {
					base.resetTransform();
				} else {
					base.setTransform(1, 0, 0, 1, 0, 0);
				}
				base.scale(dpr, dpr);
				base.fillStyle = options.color;
				// width is in media pixels
				base.fillRect(
					Math.floor(x - options.width / 2),
					0,
					Math.max(1, options.width),
					ctx.sizes.paneHeight
				);
			} finally {
				base.restore();
			}
		},

		onRenderTimeAxis(ctx) {
			console.log("onRenderTimeAxis", ctx);
			if (!options.showLabel) return;
			const timeCtx = ctx.contexts.time;
			if (!timeCtx) return;
			const x = coordinateX(ctx);
			if (x === null) return;
			const dpr = ctx.sizes.devicePixelRatio || 1;
			timeCtx.save();
			try {
				if (typeof timeCtx.resetTransform === "function") {
					timeCtx.resetTransform();
				} else {
					timeCtx.setTransform(1, 0, 0, 1, 0, 0);
				}
				timeCtx.scale(dpr, dpr);
				timeCtx.font =
					"12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
				timeCtx.textBaseline = "top";
				const text = options.labelText || "";
				const metrics = timeCtx.measureText(text);
				const paddingX = 6;
				const paddingY = 4;
				const boxWidth = Math.ceil(metrics.width) + paddingX * 2;
				const boxHeight = 16 + paddingY * 2;
				const left = Math.floor(x - boxWidth / 2);
				const top = Math.max(
					0,
					Math.floor((ctx.sizes.timeAxisHeight - boxHeight) / 2)
				);
				timeCtx.fillStyle = options.labelBackgroundColor;
				timeCtx.fillRect(left, top, boxWidth, boxHeight);
				timeCtx.fillStyle = options.labelTextColor;
				timeCtx.fillText(text, left + paddingX, top + paddingY);
			} finally {
				timeCtx.restore();
			}
		},

		onResize(ctx) {
			ctx.requestRender(false);
		},

		applyOptions(patch) {
			options = { ...options, ...(patch || {}) };
		},
	};
}
