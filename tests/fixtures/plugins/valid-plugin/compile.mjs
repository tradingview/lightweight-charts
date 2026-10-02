import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

fs.mkdirSync(distDir, { recursive: true });

const jsContent = `
export class ValidSamplePlugin {
	constructor() {
		this.name = 'ValidSamplePlugin';
	}
	attached() {}
	detached() {}
}
`;

const dtsContent = `
export declare class ValidSamplePlugin {
	name: string;
	attached(): void;
	detached(): void;
}
`;

fs.writeFileSync(path.join(distDir, 'valid-sample.js'), jsContent);
fs.writeFileSync(path.join(distDir, 'valid-sample.standalone.js'), jsContent);
fs.writeFileSync(path.join(distDir, 'valid-sample.d.ts'), dtsContent);
