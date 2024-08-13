import fs from 'node:fs/promises';
import process from 'node:process';

/*
    Quick test to check if there are any duplicates in the d.ts file
    which dts-bundle-generator found. The simple quick test is to
    look for the string '$1 '.
*/

async function checkDtsFile(filePath) {
	try {
		// Read the contents of the .d.ts file
		const content = await fs.readFile(filePath, 'utf-8');

		// Check if the content includes the string '$1 '
		if (content.includes('$1 ')) {
			console.error('Error: The string "$1 " was found in the .d.ts file. This typically means there is a duplicate type definition.');
			process.exit(1); // Exit with an error code
		} else {
			process.exit(0); // Exit successfully
		}
	} catch (error) {
		console.error('An error occurred:', error.message);
		process.exit(1); // Exit with an error code
	}
}

// Check if a file path is provided as a command-line argument
if (process.argv.length < 3) {
	console.error(
		'Please provide the path to the .d.ts file as a command-line argument.'
	);
	process.exit(1);
}

const filePath = process.argv[2];
checkDtsFile(filePath);
