import { colorStringToGrayscale } from '../helpers/color';

import { IChartWidgetBase } from './chart-widget';

type LogoTheme = 'dark' | 'light';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 19" width="35" height="19" fill="none"><g fill-rule="evenodd" clip-path="url(#a)" clip-rule="evenodd"><path fill="var(--stroke)" d="M2 0H0v10h6v9h21.4l.5-1.3 6-15 1-2.7H23.7l-.5 1.3-.2.6a5 5 0 0 0-7-.9V0H2Zm20 17h4l5.2-13 .8-2h-7l-1 2.5-.2.5-1.5 3.8-.3.7V17Zm-.8-10a3 3 0 0 0 .7-2.7A3 3 0 1 0 16.8 7h4.4ZM14 7V2H2v6h6v9h4V7h2Z"/><path fill="var(--fill)" d="M14 2H2v6h6v9h6V2Zm12 15h-7l6-15h7l-6 15Zm-7-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></g><defs><clipPath id="a"><path fill="var(--stroke)" d="M0 0h35v19H0z"/></clipPath></defs></svg>`;
const css = `a#tv-attr-logo{--fill:#131722;--stroke:#fff;position:absolute;left:10px;bottom:10px;height:19px;width:35px;margin:0;padding:0;border:0;z-index:3;}a#tv-attr-logo[data-dark]{--fill:#D1D4DC;--stroke:#131722;}`;

// This widget doesn't support dynamically responding to options changes
// because it is expected that the `attributionLogo` option won't be changed
// and this saves some bundle size.
export class AttributionLogoWidget {
	private readonly _chart: IChartWidgetBase;
	private readonly _container: HTMLElement;
	private _element: HTMLAnchorElement | undefined = undefined;
	private _cssElement: HTMLStyleElement | undefined = undefined;
	private _theme: LogoTheme | undefined = undefined;
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

	private _themeToUse(): LogoTheme {
		return colorStringToGrayscale(this._chart.options().layout.textColor) > 160 ? 'dark' : 'light';
	}

	private _shouldBeVisible(): boolean {
		return this._chart.options().layout.attributionLogo;
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
			this._element.href = `https://www.tradingview.com/?utm_medium=lwc-link&utm_campaign=lwc-chart${this._getUTMSource()}`;
			this._element.title = 'Charting by TradingView';
			this._element.id = 'tv-attr-logo';
			this._element.target = '_blank';
			this._element.innerHTML = svg;
			this._element.toggleAttribute('data-dark', this._theme === 'dark');
			this._container.appendChild(this._cssElement);
			this._container.appendChild(this._element);
		}
	}
}
