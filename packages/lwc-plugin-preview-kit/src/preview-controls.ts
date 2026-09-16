/**
 * The small control row of a catalogue preview page. Plain DOM: a preview is a
 * self-contained page inside an iframe, so it carries no framework.
 *
 * Every control is declared in the preview's own script, which keeps the HTML
 * page down to the two elements the layout needs (`#controls` and `#chart`).
 */

/** One option of a {@link SelectControl}: a bare value, or a value with its own label. */
export type SelectOption = string | { value: string; label: string };

/** A labelled `<select>`. `value` picks the initial option, else the first one. */
export interface SelectControl {
	kind: 'select';
	label: string;
	options: readonly SelectOption[];
	value?: string;
	/** Called with the new value on every change, never on mount. */
	onChange: (value: string) => void;
}

/** A labelled checkbox. */
export interface CheckboxControl {
	kind: 'checkbox';
	label: string;
	checked?: boolean;
	/** Called with the new state on every change, never on mount. */
	onChange: (checked: boolean) => void;
}

/** A push button, for a preview that toggles something rather than sets it. */
export interface ButtonControl {
	kind: 'button';
	label: string;
	onClick: (button: HTMLButtonElement) => void;
}

export type ControlDef = SelectControl | CheckboxControl | ButtonControl;

/**
 * The row the controls are appended to: `#controls` when the page has one,
 * otherwise a row created at the top of the body, above the chart.
 */
function controlRow(): HTMLElement {
	const existing = document.getElementById('controls');
	if (existing !== null) {
		return existing;
	}
	const row = document.createElement('div');
	row.id = 'controls';
	document.body.insertBefore(row, document.body.firstChild);
	return row;
}

function labelled(label: string, control: HTMLElement, controlFirst: boolean): HTMLLabelElement {
	const element = document.createElement('label');
	const text = document.createTextNode(label);
	element.append(...(controlFirst ? [control, text] : [text, control]));
	return element;
}

function mountSelect(def: SelectControl): HTMLElement {
	const select = document.createElement('select');
	for (const option of def.options) {
		const value = typeof option === 'string' ? option : option.value;
		const element = document.createElement('option');
		element.value = value;
		element.textContent = typeof option === 'string' ? option : option.label;
		select.appendChild(element);
	}
	if (def.value !== undefined) {
		select.value = def.value;
	}
	select.addEventListener('change', () => def.onChange(select.value));
	return labelled(def.label, select, false);
}

function mountCheckbox(def: CheckboxControl): HTMLElement {
	const input = document.createElement('input');
	input.type = 'checkbox';
	input.checked = def.checked ?? false;
	input.addEventListener('change', () => def.onChange(input.checked));
	// The box before its text, as a checkbox reads.
	return labelled(def.label, input, true);
}

function mountButton(def: ButtonControl): HTMLButtonElement {
	const button = document.createElement('button');
	button.type = 'button';
	button.textContent = def.label;
	button.addEventListener('click', () => def.onClick(button));
	return button;
}

/**
 * Appends the declared controls to the preview's control row and returns it.
 * Nothing is called back on mount: a preview applies its own initial options
 * when it creates the series, so the controls only report later changes.
 */
export function mountControls(defs: readonly ControlDef[]): HTMLElement {
	const row = controlRow();
	for (const def of defs) {
		row.appendChild(
			def.kind === 'select'
				? mountSelect(def)
				: def.kind === 'checkbox'
					? mountCheckbox(def)
					: mountButton(def)
		);
	}
	return row;
}

/**
 * Adds a "New data" button, for the previews whose sample data is random: one
 * click gives the reader another shape without reloading the page.
 */
export function addRefreshButton(onRefresh: () => void): HTMLButtonElement {
	const button = mountButton({ kind: 'button', label: 'New data', onClick: () => onRefresh() });
	controlRow().appendChild(button);
	return button;
}
