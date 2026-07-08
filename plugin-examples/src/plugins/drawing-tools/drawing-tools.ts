import { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';
import { RectangleDrawingTool } from './rectangle';
import { LineDrawingTool } from './line';
import { RectangleDrawingToolOptions, LineDrawingToolOptions } from './options';

export class ShapeIdGenerator {
	private static _nextId = 0;
	public static getNextId(): string {
		return `${ShapeIdGenerator._nextId++}`;
	}
} 

export class DrawingTools {
	private _rectangleTool: RectangleDrawingTool;
	private _lineTool: LineDrawingTool;
	private _currentTool: 'rectangle' | 'line' | null = null;
	private _drawingsToolbarContainer: HTMLDivElement;
	private _rectangleButton: HTMLDivElement | undefined;
	private _lineButton: HTMLDivElement | undefined;

	private _activeButtonColor: string = '#000000'; 
	private readonly _inactiveColor = '#646464';

	private _selectedBaseColor: string = '#000000'; 
	private _currentOpacity: number = 0.35; 

	constructor(
		chart: IChartApi,
		series: ISeriesApi<SeriesType>,
		drawingsToolbarContainer: HTMLDivElement,
		rectangleOptions: Partial<RectangleDrawingToolOptions> = {},
		lineOptions: Partial<LineDrawingToolOptions> = {}
	) {
		this._drawingsToolbarContainer = drawingsToolbarContainer;
		this._rectangleTool = new RectangleDrawingTool(
			chart,
			series,
			rectangleOptions,
			this.stopDrawing.bind(this)
		);
		this._lineTool = new LineDrawingTool(
			chart,
			series,
			lineOptions,
			this.stopDrawing.bind(this)
		);

		this._createToolbar();
		this._updateDrawingToolColorsAndOpacity();
	}

	private _createToolbar() {
		const lineButton = document.createElement('div');
		lineButton.style.width = '24px';
		lineButton.style.height = '24px';
		lineButton.style.cursor = 'pointer';
		lineButton.style.fill = this._inactiveColor;
		lineButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.71,3.29a1,1,0,0,0-1.42,0L3.29,20.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L21.71,4.71A1,1,0,0,0,21.71,3.29Z"/></svg>`;
		lineButton.addEventListener('click', () => this.selectLineTool());
		this._drawingsToolbarContainer.appendChild(lineButton);
		this._lineButton = lineButton;

		const rectButton = document.createElement('div');
		rectButton.style.width = '24px';
		rectButton.style.height = '24px';
		rectButton.style.cursor = 'pointer';
		rectButton.style.fill = this._inactiveColor;
		rectButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2v20h20V2H2zm18 18H4V4h16v16z"/></svg>`;
		rectButton.addEventListener('click', () => this.selectRectangleTool());
		this._drawingsToolbarContainer.appendChild(rectButton);
		this._rectangleButton = rectButton;

		const colorPicker = document.createElement('input');
		colorPicker.type = 'color';
		colorPicker.value = this._selectedBaseColor;
		colorPicker.style.width = '24px';
		colorPicker.style.height = '24px';
		colorPicker.style.border = 'none';
		colorPicker.style.padding = '0px';
		colorPicker.style.cursor = 'pointer';
		colorPicker.style.backgroundColor = 'transparent';
		colorPicker.addEventListener('input', () => {
			this._selectedBaseColor = colorPicker.value;
			this._activeButtonColor = this._selectedBaseColor;

			this._updateDrawingToolColorsAndOpacity();
			this._updateButtonStyles();
		});
		this._drawingsToolbarContainer.appendChild(colorPicker);

		const opacitySlider = document.createElement('input');
		opacitySlider.type = 'range';
		opacitySlider.min = '0';
		opacitySlider.max = '1';
		opacitySlider.step = '0.01';
		opacitySlider.value = this._currentOpacity.toString();
		opacitySlider.style.width = '80px';
		opacitySlider.addEventListener('input', () => {
			this._currentOpacity = parseFloat(opacitySlider.value);
			this._updateDrawingToolColorsAndOpacity();
		});
		this._drawingsToolbarContainer.appendChild(opacitySlider);
	}

	private _hexToRgba(hex: string, alpha: number): string {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	private _updateDrawingToolColorsAndOpacity() {
		const previewOpacityFactor = 0.5;
		this._lineTool.options.lineColor = this._hexToRgba(this._selectedBaseColor, this._currentOpacity);
		this._lineTool.options.previewLineColor = this._hexToRgba(this._selectedBaseColor, this._currentOpacity * previewOpacityFactor);
		this._lineTool.options.labelColor = this._selectedBaseColor;		
		this._rectangleTool.options.fillColor = this._hexToRgba(this._selectedBaseColor, this._currentOpacity);
		this._rectangleTool.options.previewFillColor = this._hexToRgba(this._selectedBaseColor, this._currentOpacity * previewOpacityFactor);
		this._rectangleTool.options.labelColor = this._selectedBaseColor;	
	}

	selectRectangleTool() {
		if (this._currentTool === 'rectangle') {
			this.stopDrawing();
			return;
		}
		this._stopAllDrawing();
		this._currentTool = 'rectangle';
		this._rectangleTool.startDrawing();
		this._updateButtonStyles();
	}

	selectLineTool() {
		if (this._currentTool === 'line') {
			this.stopDrawing();
			return;
		}
		this._stopAllDrawing();
		this._currentTool = 'line';
		this._lineTool.startDrawing();
		this._updateButtonStyles();
	}

	stopDrawing() {
		this._stopAllDrawing();
		this._currentTool = null;
		this._updateButtonStyles();
	}

	private _stopAllDrawing() {
		this._rectangleTool.stopDrawing();
		this._lineTool.stopDrawing();
	}

	private _updateButtonStyles() {
		if (this._rectangleButton) {
			this._rectangleButton.style.fill = this._currentTool === 'rectangle' ? this._activeButtonColor : this._inactiveColor;
		}
		if (this._lineButton) {
			this._lineButton.style.fill = this._currentTool === 'line' ? this._activeButtonColor : this._inactiveColor;
		}
	}

	getCurrentTool() {
		return this._currentTool;
	}

	remove() {
		this.stopDrawing();
		this._rectangleTool.remove();
		this._lineTool.remove();
		this._drawingsToolbarContainer.innerHTML = '';
	}
} 