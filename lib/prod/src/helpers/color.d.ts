export declare function applyAlpha(color: string, alpha: number): string;
export interface ContrastColors {
    foreground: string;
    background: string;
}
export declare function generateContrastColors(backgroundColor: string): ContrastColors;
export declare function gradientColorAtPercent(topColor: string, bottomColor: string, percent: number): string;
