# Debug Folder

This folder is designed for creating and testing debug files that won't be
committed to the repository. It's a safe space for contributors to experiment
and test without affecting the main codebase.

If you looking for development environment akin to blitzstack or codesandbox, please
see [PLAYGROUND/README.md](./PLAYGROUND).

## Contents

This folder contains example files to help you get started:

- `debug-esm.html.example`
- `debug-esm.js.example`
- `debug-standalone.html.example`

## Usage

### ESM Version

To use the ESM (ECMAScript Module) version:

1. Serve the repository on a local HTTP server. For example, you can use:

   ```bash
   npx serve
   ```

2. Navigate to `http://localhost:3000/debug/debug-esm.html` in your browser.
   - Note: The port number (3000 in this example) should match the output from
     your HTTP server tool.
   - Replace `debug-esm.html` with the name of your test file.

### Standalone Version

The standalone version can be opened directly in the browser without needing a
local HTTP server.

## Creating Your Own Debug Files

1. Create a new file in this folder with a descriptive name (e.g.,
   `my-debug-test.html` or `my-debug-test.js`).
2. Use the example files as templates for your own debug files.
3. These files will be automatically ignored by Git (via .gitignore), so they
   won't be committed to the repository.

## TypeScript Support

This folder includes a `tsconfig.json` file to enable TypeScript type checking for JavaScript files. This allows you to get IDE warnings and suggestions based on JSDoc type annotations.

To take advantage of this:

1. Ensure your IDE is configured to use the `tsconfig.json` in this folder.
2. Use JSDoc comments in your JavaScript files to provide type information.
3. You should now see TypeScript warnings and suggestions in your IDE when working with .js and .mjs files in this folder.

## Best Practices

- Always use this folder for temporary debugging and testing.
- Don't rely on files in this folder for actual project functionality.
- Remember to clean up your debug files when you're done with them.

## Contributing

When contributing to the project:

1. Use this debug folder to test your changes or experiments.
2. Once you're confident in your changes, implement them in the main project
   files.
3. Do not commit any files from the debug folder to the repository.

If you have any questions about using the debug folder, please reach out to the
project maintainers.
