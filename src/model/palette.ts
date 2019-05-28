import { ensureDefined } from '../helpers/assertions';

export class Palette {
	private readonly _colorToIndex: Map<string, number> = new Map();
	private readonly _indexToColor: Map<number, string> = new Map();

	public add(index: number, color: string): void {
		this._colorToIndex.set(color, index);
		this._indexToColor.set(index, color);
	}

	public colorByIndex(index: number): string {
		return ensureDefined(this._indexToColor.get(index));
	}

	public indexByColor(color: string): number {
		return ensureDefined(this._colorToIndex.get(color));
	}

	public hasColor(color: string): boolean {
		return this._colorToIndex.has(color);
	}

	public size(): number {
		return this._indexToColor.size;
	}
}
