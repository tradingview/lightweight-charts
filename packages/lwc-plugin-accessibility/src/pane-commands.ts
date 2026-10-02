import { PaneLayer } from './dom/pane-dom';
import { AccessibilityCommand } from './keyboard';
import { AccessibilityMessages } from './messages';
import { AccessibilityPaneOptions } from './options';
import { PaneCursor } from './pane-cursor';

/** What the commands read from, and change on, the owning primitive. */
export interface CommandHost {
	cursor: PaneCursor;
	layer: () => PaneLayer | null;
	options: () => AccessibilityPaneOptions;
	messages: () => AccessibilityMessages;
	/** Speaks through the pane's assertive region (and `onAnnounce`). */
	announce: (message: string) => void;
	highContrast: () => boolean;
	shortcutsOpen: () => boolean;
	setShortcutsOpen: (open: boolean) => void;
	/** Re-applies the current view to the injected DOM. */
	render: () => void;
}

/**
 * What every key the plugin handles actually does. Kept out of the primitive so
 * the command set can grow without the primitive growing with it.
 */
export function createCommands(host: CommandHost): Record<AccessibilityCommand, () => void> {
	/**
	 * The "view as table" command (`T`): renders the active series' scoped points
	 * into a real `<table>` on demand – the text alternative WCAG asks for – and
	 * removes it again on close, so a large series costs nothing until asked for.
	 */
	const toggleTable = (): void => {
		const layer = host.layer();
		if (!layer) {
			return;
		}
		if (layer.table.isOpen()) {
			closePanels();
			return;
		}
		const model = host.cursor.tableModel();
		layer.table.open(model, host.highContrast());
		host.announce(model.truncated.length > 0 ? `${model.caption} ${model.truncated}` : model.caption);
	};

	/** `Escape`: closes whichever panel is open and returns focus to the layer. */
	const closePanels = (): void => {
		const layer = host.layer();
		if (layer?.table.isOpen()) {
			layer.table.close();
			layer.container.focus();
		}
		if (host.shortcutsOpen()) {
			host.setShortcutsOpen(false);
			host.render();
		}
	};

	return {
		nextPoint: (): void => host.cursor.movePoint(1),
		previousPoint: (): void => host.cursor.movePoint(-1),
		previousSeries: (): void => host.cursor.moveSeries(-1),
		nextSeries: (): void => host.cursor.moveSeries(1),
		pageForward: (): void => host.cursor.movePoint(host.options().pageStep),
		pageBack: (): void => host.cursor.movePoint(-host.options().pageStep),
		firstPoint: (): void => host.cursor.setFirstPoint(),
		lastPoint: (): void => host.cursor.setLastPoint(),
		zoomIn: (): void => host.cursor.zoom(true),
		zoomOut: (): void => host.cursor.zoom(false),
		summary: (): void => host.announce(host.cursor.describe()),
		// H both speaks the controls and toggles the visible panel.
		help: (): void => {
			host.announce(host.messages().help({
				multiSeries: host.cursor.seriesCount() > 1,
				pageStep: host.options().pageStep,
			}));
			host.setShortcutsOpen(!host.shortcutsOpen() && host.options().showShortcuts);
			host.render();
		},
		viewAsTable: toggleTable,
		closePanels,
	};
}
