// Minimal worker plugin example for Lightweight Charts worker mode
// Exports a factory: createMinimalWorkerPlugin(options?)

export function createMinimalWorkerPlugin(initialOptions = {}) {
	let options = {
		text: initialOptions.text || "Worker Plugin",
		color: initialOptions.color || "#0a0",
		background: initialOptions.background || "rgba(0,0,0,0.15)",
		showBox:
			initialOptions.showBox !== undefined ? !!initialOptions.showBox : true,
	};

	return {
		onInit(ctx) {
			// Request an initial overlay render to display right away
			ctx.requestRender(true);
		},

		onRenderOverlay(ctx) {
			const overlay = ctx.contexts.overlay;
			if (!overlay) return;

			const dpr = ctx.sizes.devicePixelRatio || 1;
			const paddingX = 8;
			const paddingY = 6;
			const textX = 10;
			const textY = 18;

			overlay.save();
			try {
				// Map media coordinates to bitmap by scaling with DPR
				if (typeof overlay.resetTransform === "function") {
					overlay.resetTransform();
				} else {
					overlay.setTransform(1, 0, 0, 1, 0, 0);
				}
				overlay.scale(dpr, dpr);

				overlay.font =
					"12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
				overlay.textBaseline = "top";

				const metrics = overlay.measureText(options.text);
				const boxWidth = Math.ceil(metrics.width) + paddingX * 2;
				const boxHeight = 18 + paddingY * 2;
				if (options.showBox) {
					overlay.fillStyle = options.background;
					overlay.fillRect(6, 6, boxWidth, boxHeight);
				}

				overlay.fillStyle = options.color;
				overlay.fillText(options.text, textX + paddingX, textY - 6 + paddingY);
			} finally {
				overlay.restore();
			}
		},

		onResize(ctx) {
			// Repaint overlay on resize to keep label aligned
			ctx.requestRender(true);
		},

		applyOptions(patch) {
			options = { ...options, ...(patch || {}) };
		},

		onDestroy() {
		},
	};
}
