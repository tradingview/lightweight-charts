const { readFile, writeFile } = require('fs/promises');

function getDtsContent(versions) {
	return `declare type Version = ${versions.map(x => `'${x}'`).join(' | ')};
declare const versions: Version[];
export type { Version };
// eslint-disable-next-line import/no-default-export
export default versions;
`;
}

module.exports = function generateVersionsJsonDts(context, options) {
	return {
		name: 'generate-versions-json-dts',
		async loadContent() {
			const file = await readFile(options.versionsJsonPath, 'utf-8');
			const versions = JSON.parse(file);
			const dtsContent = getDtsContent(versions);
			await writeFile(options.versionsDtsOutputPath, dtsContent);
		},
	};
};
