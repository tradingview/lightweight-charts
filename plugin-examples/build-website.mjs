import {
	existsSync,
	mkdirSync,
	readdirSync,
	statSync,
	readFileSync,
	writeFileSync,
	rmSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const currentDir = dirname(__filename);

const distFolder = resolve(currentDir, 'dist');
const distSrcFolder = resolve(currentDir, 'dist', 'src');
const websiteFolder = resolve(currentDir, 'website');
const docsWebsiteFolder = resolve(currentDir, '..', 'website', 'build', 'plugin-examples');

function emptyDir(dir) {
	if (!existsSync(dir)) {
		return;
	}
	for (const file of readdirSync(dir)) {
		rmSync(resolve(dir, file), { recursive: true, force: true });
	}
}

function copy(src, dest, contentReplacer) {
	const stat = statSync(src);
	if (stat.isDirectory()) {
		copyDir(src, dest, contentReplacer);
	} else {
		const content = readFileSync(src).toString();
		writeFileSync(dest, contentReplacer ? contentReplacer(content) : content);
	}
}

function copyDir(srcDir, destDir, contentReplacer) {
	mkdirSync(destDir, { recursive: true });
	for (const file of readdirSync(srcDir)) {
		const srcFile = resolve(srcDir, file);
		const destFile = resolve(destDir, file);
		if (file !== 'src') {
			copy(srcFile, destFile, contentReplacer);
		}
	}
}

function contentReplacer(content) {
	return content
		.replace(/("|')\.\.\/assets/g, '$1./assets')
		.replace(/\/\.\.\/assets/g, '/assets');
}

emptyDir(websiteFolder);
copyDir(distFolder, websiteFolder, contentReplacer, 'src');
copyDir(distSrcFolder, websiteFolder, contentReplacer);
copy(
	resolve(websiteFolder, 'index.html'),
	resolve(websiteFolder, 'index.html'),
	content => {
		return content.replace(
			'<head>',
			'<head>\n<base href="/lightweight-charts/plugin-examples/">'
		);
	}
);

// Copy into the documentation site build
copyDir(websiteFolder, docsWebsiteFolder, content => content);
