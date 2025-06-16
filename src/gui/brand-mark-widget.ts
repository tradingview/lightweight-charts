import { IChartWidgetBase } from './chart-widget';

type BrandTheme = 'dark' | 'light';

const html = `<span style="font-weight:bold">MG</span>`;
const css = `a#mg-brand-mark{--fill:#131722;--stroke:#fff;position:absolute;left:10px;bottom:10px;height:19px;width:35px;display:flex;align-items:center;justify-content:center;margin:0;padding:0;border:0;z-index:3;font-family:inherit;}a#mg-brand-mark[data-dark]{--fill:#D1D4DC;--stroke:#131722;}`;

// This widget doesn't support dynamically responding to options changes
// because it is expected that the `brandMark` option won't be changed
// and this saves some bundle size.
export class BrandMarkWidget {
	private readonly _chart: IChartWidgetBase;
	private readonly _container: HTMLElement;
	private _element: HTMLAnchorElement | undefined = undefined;
    private _cssElement: HTMLStyleElement | undefined = undefined;
    private _theme: BrandTheme | undefined = undefined;
	private _visible: boolean = false;

	public constructor(container: HTMLElement, chart: IChartWidgetBase) {
		this._container = container;
		this._chart = chart;
		this._render();
	}

	public update(): void {
		this._render();
	}

	public removeElement(): void {
		if (this._element) {
			this._container.removeChild(this._element);
		}
		if (this._cssElement) {
			this._container.removeChild(this._cssElement);
		}
		this._element = undefined;
		this._cssElement = undefined;
	}

	private _shouldUpdate(): boolean {
		return this._visible !== this._shouldBeVisible() || this._theme !== this._themeToUse();
	}

    private _themeToUse(): BrandTheme {
		return this._chart
			.model()
			.colorParser()
			.colorStringToGrayscale(this._chart.options()['layout'].textColor) > 160
			? 'dark'
			: 'light';
	}

	private _shouldBeVisible(): boolean {
            return this._chart.options()['layout'].brandMark;
	}

	private _getUTMSource(): string {
		const url = new URL(location.href);
		if (!url.hostname) {
			// ignore local testing
			return '';
		}
		return '&utm_source=' + url.hostname + url.pathname;
	}

	private _render(): void {
		if (!this._shouldUpdate()) {
			return;
		}
		this.removeElement();
		this._visible = this._shouldBeVisible();
		if (this._visible) {
			this._theme = this._themeToUse();
			this._cssElement = document.createElement('style');
			this._cssElement.innerText = css;
                this._element = document.createElement('a');
                this._element.href = `https://macroglide.com/?utm_source=${this._getUTMSource()}`;
                this._element.title = 'Charting by MacroGlide';
                this._element.id = 'mg-brand-mark';
			this._element.target = '_blank';
                this._element.innerHTML = html;
                this._element.toggleAttribute('data-dark', this._theme === 'dark');
			this._container.appendChild(this._cssElement);
			this._container.appendChild(this._element);
		}
	}
}
