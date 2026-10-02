import { DescribeEnv } from './describe';
import { AnySeries, SeriesDataPoint } from './types';

/** One row of the "view as table" panel: the time, then one cell per column. */
export interface DataTableRow {
	time: string;
	values: readonly string[];
}

/** Everything the table panel shows. Built by the primitive on demand. */
export interface DataTableModel {
	/** Caption of the table, naming the series and the number of rows. */
	caption: string;
	/** Column headers, the first of which labels the time column. */
	columns: readonly string[];
	rows: readonly DataTableRow[];
	/** Note shown (and spoken) when the rows were capped by `tableMaxRows`, or `''`. */
	truncated: string;
	/** Label of the panel's close button. */
	closeLabel: string;
}

/**
 * Turns the scoped points of a series into the table model. OHLC columns are
 * used when the points carry a high / low band (a bar or candlestick series, or
 * a custom one with a `rangeAccessor`), otherwise a single value column.
 *
 * The rows are capped at `maxRows`: a table is a DOM node per cell, so a
 * 50,000-bar series would otherwise freeze the page the moment `T` is pressed.
 */
export function buildTableModel(
	env: DescribeEnv,
	args: {
		points: readonly SeriesDataPoint[];
		series: AnySeries | null;
		label: string;
		maxRows: number;
	}
): DataTableModel {
	const { points, series, label, maxRows } = args;
	const labels = env.messages.tableColumns;
	const ohlc = points.some((point: SeriesDataPoint) => env.range(point, series)?.open !== undefined);
	const shown = points.slice(0, Math.max(0, maxRows));
	const rows = shown.map((point: SeriesDataPoint) => {
		const range = env.range(point, series);
		const value = env.value(point, series);
		const cell = (field: number | undefined): string =>
			field === undefined ? env.messages.noValue : env.formatValue(field, series);
		return {
			time: env.formatTime(point.time),
			values: ohlc
				? [cell(range?.open), cell(range?.high), cell(range?.low), cell(range?.close ?? value)]
				: [cell(value)],
		};
	});
	return {
		caption: env.messages.tableCaption({ label, count: points.length, scopeNote: env.scopeNote }),
		columns: ohlc
			? [labels.time, labels.open, labels.high, labels.low, labels.close]
			: [labels.time, labels.value],
		rows,
		truncated: shown.length < points.length
			? env.messages.tableTruncated({ shown: shown.length, total: points.length })
			: '',
		closeLabel: env.messages.tableClose,
	};
}

const PANEL_STYLE = [
	'position:absolute',
	// Logical properties so the panel sits on the leading side in both
	// left-to-right and right-to-left pages.
	'inset-inline-start:8px',
	'inset-block-start:8px',
	'max-inline-size:calc(100% - 16px)',
	'max-block-size:calc(100% - 16px)',
	'overflow:auto',
	'z-index:7',
	'padding:8px 11px',
	'border-radius:6px',
	'font-size:0.8125rem',
	'line-height:1.45',
	// The layer itself is transparent to the pointer; the table must not be, or
	// it could not be scrolled with the mouse.
	'pointer-events:auto',
].join(';');

/**
 * The "view as table" panel (`T`): the active series rendered as a real
 * `<table>` — the WCAG-recommended text alternative for a chart.
 *
 * The table is built only while it is open, so a 50,000-bar series costs
 * nothing until the user asks for it, and is removed again on close.
 */
export class DataTable {
	private readonly _panel: HTMLElement;
	private _open = false;

	public constructor(host: HTMLElement) {
		this._panel = document.createElement('div');
		this._panel.className = 'lw-chart-a11y-data-table';
		this._panel.tabIndex = -1;
		this._panel.hidden = true;
		host.appendChild(this._panel);
	}

	public isOpen(): boolean {
		return this._open;
	}

	/** Shows the table for `model`, replacing anything shown before. */
	public open(model: DataTableModel, highContrast: boolean): void {
		this._open = true;
		this._panel.hidden = false;
		this._style(highContrast);
		this._build(model);
		// Moving focus into the panel makes a screen reader read the table where
		// it is; the panel is inside the layer, so key handling is unaffected.
		this._panel.focus();
	}

	public close(): void {
		this._open = false;
		this._panel.hidden = true;
		this._panel.textContent = '';
	}

	/** Re-applies the contrast palette to an open panel (the content is unchanged). */
	public restyle(highContrast: boolean): void {
		if (this._open) {
			this._style(highContrast);
		}
	}

	public remove(): void {
		this._panel.remove();
	}

	private _style(highContrast: boolean): void {
		const surface = highContrast
			? 'background:#000;color:#fff;border:2px solid #fff;'
			: 'background:rgba(20,24,28,0.95);color:#fff;border:1px solid rgba(255,255,255,0.25);box-shadow:0 2px 10px rgba(0,0,0,0.45);';
		this._panel.style.cssText = `${PANEL_STYLE};${surface}`;
	}

	private _build(model: DataTableModel): void {
		this._panel.textContent = '';
		const table = document.createElement('table');
		table.style.cssText = 'border-collapse:collapse;inline-size:100%;';

		const caption = document.createElement('caption');
		caption.textContent = model.truncated.length > 0
			? `${model.caption} ${model.truncated}`
			: model.caption;
		caption.style.cssText = 'text-align:start;font-weight:600;margin-block-end:6px;';
		table.appendChild(caption);

		const head = document.createElement('thead');
		const headRow = document.createElement('tr');
		for (const column of model.columns) {
			const cell = document.createElement('th');
			cell.scope = 'col';
			cell.textContent = column;
			cell.style.cssText = 'text-align:start;padding:2px 8px;border-block-end:1px solid currentColor;';
			headRow.appendChild(cell);
		}
		head.appendChild(headRow);
		table.appendChild(head);

		const body = document.createElement('tbody');
		for (const row of model.rows) {
			const tr = document.createElement('tr');
			// The time is the row header, so a screen reader announces it with
			// every value cell of that row.
			const header = document.createElement('th');
			header.scope = 'row';
			header.textContent = row.time;
			header.style.cssText = 'text-align:start;padding:2px 8px;font-weight:400;white-space:nowrap;';
			tr.appendChild(header);
			for (const value of row.values) {
				const cell = document.createElement('td');
				cell.textContent = value;
				cell.style.cssText = 'text-align:end;padding:2px 8px;white-space:nowrap;';
				tr.appendChild(cell);
			}
			body.appendChild(tr);
		}
		table.appendChild(body);
		this._panel.appendChild(table);

		const hint = document.createElement('div');
		hint.textContent = model.closeLabel;
		hint.style.cssText = 'margin-block-start:6px;opacity:0.8;';
		this._panel.appendChild(hint);
	}
}
