# Lightweight Charts Documentation Website

The source of the documentation website for Lightweight Charts. This website is built using [Docusaurus 2](https://v2.docusaurus.io/).

The aim of this documentation is to make using the library frictionless.

API documentation is automatically generated from the `typings.d.ts` file, which itself is generated as part of the library build process.

Handwritten documentation should focus on explaining concepts, tutorials, interactive examples, or in general anything that can't be automatically generated.

## Local Development

```console
npm run start
```

_Note_: API documentation will not be generated unless you have already built the library and its `typings.d.ts` file.

This command starts a local development server and opens a browser window. Most changes are reflected live without having to restart the server.

## Build

```console
npm run build
```

_Note_: API documentation will not be generated unless you have already built the library and its `typings.d.ts` file.

This command generates static content in the `build` directory.

## Serve Build Locally

```console
npm run serve
```

_Note_: Embedded `.html` examples won't display correctly when using this command but will work correctly when hosted online.

This command serves the built website locally.

## Deployment

```console
GIT_USER=<Your GitHub username> GITHUB_ORGANIZATION_NAME=<Your Github username or organization name> USE_SSH=true npm deploy
```

_Note_: API documentation will not be generated unless you have already built the library and its `typings.d.ts` file.

This will build the website into static files and push the files to the `gh-pages` branch.

## Adding a new version

Run the following command replacing $VERSION with the name of a version you would like to create. $VERSION should match one of the available versions of the package on [unpkg.com](https://unpkg.com)

See [the Docusaurus versioning docs](https://docusaurus.io/docs/versioning#tagging-a-new-version) for an explanation of the Docusaurus versioning behaviour.

```bash
npm run docusaurus docs:version $VERSION
```

For example:

```bash
npm run docusaurus docs:version 3.7.0
```

## CircleCI

We use CircleCI to build, test, publish the library, and to deploy this website.

The `build-docusaurus-website` and `deploy-docusaurus-website` jobs defined in `.circleci/config.yml` build and deploy the website.

The `build-docusaurus-website` job is run for all branches (so that, for example, we can get feedback about any changes that might break the website build before merging).

The `deploy-docusaurus-website` job is only run on the master branch.

## Docusaurus CLI

You can read more about the commands used to build, deploy, and more in the [Docusaurus CLI documentation.](https://docusaurus.io/docs/cli)
