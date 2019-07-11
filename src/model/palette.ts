import { ensureDefined } from '../helpers/assertions';

export class Palette {
	private _maxUsedIndex: number = 0;
	private readonly _colorToIndex: Map<string, number> = new Map();
	private readonly _indexToColor: Map<number, string> = new Map();

	public colorByIndex(index: number): string {
		return ensureDefined(this._indexToColor.get(index));
	}

	public replaceColorByIndex(color: string, index: number): void {
		const oldColor = this.colorByIndex(index);
		this._colorToIndex.delete(oldColor);
		this._colorToIndex.set(color, index);
		this._indexToColor.set(index, color);
	}

	public addColor(color: string): number {
		let res = this._colorToIndex.get(color);
		if (res === undefined) {
			res = this._maxUsedIndex++;
			this._colorToIndex.set(color, res);
			this._indexToColor.set(res, color);
		}
		return res;
	}

	public size(): number {
		return this._indexToColor.size;
	}
}
