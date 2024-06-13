/*
    DTS-Bundle Generator is incorrectly thinking that the interface named Range is a duplicate
    and is renaming it to Range$1.
    This code finds any renamed duplicates, and fixes known mistakes.
 */
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const FILE_PATH = join(process.cwd(), '/dist/typings.d.ts');
const WHITELIST = ['Range'];

function findInterfaceNames(content) {
	const interfaceRegex = /\b(type|interface)\s+([A-Za-z_$][\w$]*)\s*/g;
	const interfaces = new Set();
	const dollarInterfaces = new Set();

	let match = interfaceRegex.exec(content);
	while (match !== null) {
		const name = match[2];
		if (
			/\$\d+$/.test(name) &&
			!/{/.test(content[match.index + match[0].length])
		) {
			dollarInterfaces.add(name);
		} else {
			interfaces.add(name);
		}
        match = interfaceRegex.exec(content);
	}

	return { interfaces, dollarInterfaces };
}

function validateAndReplace(content, interfaces, dollarInterfaces) {
	const errors = [];
	const replacements = new Map();

	dollarInterfaces.forEach(dollarName => {
		const baseName = dollarName.split('$')[0];

		if (interfaces.has(baseName)) {
			errors.push(
				`Error: Duplicate name "${baseName}" for "${dollarName}" found.`
			);
		} else {
			const baseNameExistsInDollar = Array.from(dollarInterfaces).some(
				name => name.startsWith(baseName + '$') && name !== dollarName
			);

			if (baseNameExistsInDollar) {
				errors.push(
					`Error: Multiple dollar suffixed interfaces found for base name "${baseName}"`
				);
			} else if (WHITELIST.includes(baseName)) {
				replacements.set(dollarName, baseName);
			} else {
                errors.push(
                    `Error: Unexpected mistaken duplicate name "${dollarName}" found.`
                );
            }
		}
	});

	let modifiedContent = content;
	replacements.forEach((baseName, dollarName) => {
		modifiedContent = modifiedContent.replaceAll(dollarName, baseName);
	});

	return { modifiedContent, errors };
}

async function main() {
	try {
		const content = await readFile(FILE_PATH, 'utf8');
		const { interfaces, dollarInterfaces } = findInterfaceNames(content);
		const { modifiedContent, errors } = validateAndReplace(
			content,
			interfaces,
			dollarInterfaces
		);

		if (errors.length > 0) {
			errors.forEach(error => console.error(error));
			process.exit(1);
		}

		await writeFile(FILE_PATH, modifiedContent, 'utf8');
		console.log('File processed successfully.');
	} catch (error) {
		console.error(`An error occurred: ${error.message}`);
		process.exit(1);
	}
}

main();
