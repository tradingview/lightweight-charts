#!/usr/bin/env node

const { readFile, writeFile } = require('fs/promises');
const { resolve } = require('path');

function getDtsContent(versions) {
	return `declare type Version = ${versions.map(x => `'${x}'`).join(' | ')};
declare const versions: Version[];
export type { Version };
// eslint-disable-next-line import/no-default-export
export default versions;
`;
}

const versionsJsonPath = resolve(__dirname, '../versions.json');
const versionsDtsOutputPath = resolve(__dirname, '../versions.d.ts');

async function generateVersionsJsonDts() {
	const file = await readFile(versionsJsonPath, 'utf-8');
	const versions = JSON.parse(file);
	const dtsContent = getDtsContent(versions);
	await writeFile(versionsDtsOutputPath, dtsContent);
}

generateVersionsJsonDts();
