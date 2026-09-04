# Local Development of the create-lwc-plugin

The minimal supported version of [NodeJS](https://nodejs.org/) for development is 22.3, the same as for the repository as a whole.

1. Install the dependencies (the repository is a pnpm workspace — the install can be run from the repository root)

    ```shell
    pnpm install
    ```

2. Create a development stub

    ```shell
    pnpm dev
    ```

3. Running the CLI locally

    ```shell
    node index.js
    ```

    Run it from a scratch directory — it scaffolds into the current working
    directory.

4. Running the CLI in workspace mode

    ```shell
    node packages/create-lwc-plugin/index.js --workspace
    ```

    Workspace mode must be run from inside this repository: it resolves the
    repository root by looking for `pnpm-workspace.yaml`, and scaffolds into
    `packages/`. Remember to delete the scaffolded package afterwards if you were
    only testing, and to restore `pnpm-lock.yaml` if you ran an install.

## Publishing new version

1. Install the dependencies (the repository is a pnpm workspace — the install can be run from the repository root)

    ```shell
    pnpm install
    ```

2. Bump the version number in the `package.json`
3. Build the package

    ```shell
    pnpm prepublishOnly
    ```

4. Run `pnpm dlx publint@latest` and ensure that there aren't any issues with the generated `package.json`.
5. Publish the package

    ```shell
    npm publish
    ```

Hint: append `--dry-run` to the end of the publish command to see the results of
the publish command without actually uploading the package to NPM.
