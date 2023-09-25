import fs from 'node:fs';
import path from 'node:path';

export function formatTargetDir(targetDir: string | undefined) {
	return targetDir?.trim().replace(/\/+$/g, '');
}

export function copy(src: string, dest: string, contentReplacer?: (content: string) => string) {
	const stat = fs.statSync(src);
	if (stat.isDirectory()) {
		copyDir(src, dest, contentReplacer);
	} else {
		const content = fs.readFileSync(src).toString();
		fs.writeFileSync(dest, contentReplacer ? contentReplacer(content) : content);
	}
}

export function copyDir(srcDir: string, destDir: string, contentReplacer?: (content: string) => string) {
	fs.mkdirSync(destDir, { recursive: true });
	for (const file of fs.readdirSync(srcDir)) {
		const srcFile = path.resolve(srcDir, file);
		const destFile = path.resolve(destDir, file);
		copy(srcFile, destFile, contentReplacer);
	}
}

export function dirExists(dir: string) {
	return fs.existsSync(dir);
}

export function isEmpty(path: string) {
	const files = fs.readdirSync(path);
	return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

export function emptyDir(dir: string) {
	if (!fs.existsSync(dir)) {
		return;
	}
	for (const file of fs.readdirSync(dir)) {
		if (file === '.git') {
			continue;
		}
		fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
	}
}

// editFile(path.resolve(root, `vite.config.${isTs ? 'ts' : 'js'}`), content => {
// 	return content.replace('@vitejs/plugin-react', '@vitejs/plugin-react-swc');
// });
export function editFile(file: string, callback: (content: string) => string) {
	const content = fs.readFileSync(file, 'utf-8');
	fs.writeFileSync(file, callback(content), 'utf-8');
}
