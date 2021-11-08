# Lightweight Charts Documentation Website

The source of the documentation website for Lightweight Charts. This website is built using [Docusaurus 2](https://v2.docusaurus.io/), a modern static website generator.

## Local Development

```console
npm start
```

This command starts a local development server and open up a browser window. Most changes are reflected live without having to restart the server.

## Build

```console
npm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

```console
GIT_USER=<Your GitHub username> GITHUB_ORGANIZATION_NAME=<Your Github username or organisation name> USE_SSH=true npm deploy
```

This will build the website into static files and push the files to the `gh-pages` branch.

## Docusaurus CLI

You can read more about these commands, and more, in the [Docusaurus CLI documentation.](https://docusaurus.io/docs/cli)
