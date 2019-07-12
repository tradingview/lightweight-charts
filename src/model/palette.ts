import { ensureDefined } from '../helpers/assertions';

export class Palette {
	private _maxUsedIndex: number = 0;
	private readonly _colorToIndex: Map<string, number> = new Map();
	private readonly _indexToColor: Map<number, string> = new Map();

	public colorByIndex(index: number): string {
		return ensureDefined(this._indexToColor.get(index));
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

	public clear(): void {
		this._maxUsedIndex = 0;
		this._colorToIndex.clear();
		this._indexToColor.clear();
	}

	public size(): number {
		return this._indexToColor.size;
	}
}
