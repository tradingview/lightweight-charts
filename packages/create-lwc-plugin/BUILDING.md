# Local Development of the create-lwc-plugin

The minimal supported version of [NodeJS](https://nodejs.org/) for development is 18.

1. Install the dependencies

    ```shell
    npm install
    ```

2. Create a development stub

    ```shell
    npm run dev
    ```

3. Running the CLI locally

    ```shell
    node index.js
    ```

## Publishing new version

1. Install the dependencies

    ```shell
    npm install
    ```

2. Bump the version number in the `package.json`
3. Build the package

    ```shell
    npm run prepublishOnly
    ```

4. Run `npx publint@latest` and ensure that there aren't any issues with the generated `package.json`.
5. Publish the package

    ```shell
    npm publish
    ```

Hint: append `--dry-run` to the end of the publish command to see the results of
the publish command without actually uploading the package to NPM.
