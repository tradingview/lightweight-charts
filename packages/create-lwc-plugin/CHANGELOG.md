# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.2.0 - 2026-09-16

### Added

- A pane primitive template, alongside the series primitive and custom series
  templates. The wizard now offers all three plugin types.
- A `--workspace` mode for scaffolding official plugin packages inside the
  Lightweight Charts™ repository. It scopes the package name to `@tradingview/`,
  depends on the library and toolkit through `workspace:*`, seeds a
  `CHANGELOG.md` and `NOTICE`, and adds a catalogue preview page.
- The wizard offers to install the plugin-authoring Agent Skill for AI coding
  assistants such as Claude Code, Codex and Cursor, either into the new project
  or into the current directory when you quit the wizard early.
- New wizard questions for the plugin description, licence, minimum supported
  Lightweight Charts™ version and catalogue tags. The answers populate the
  `lwcPlugin` block in `package.json` that the plugin catalogue reads.
- A `check-package` script in scaffolded projects that runs `publint` and
  `arethetypeswrong` against the packed tarball, and a README section pointing
  authors at it before publishing.
- A `.gitignore` in every scaffolded project covering `dist/`, `typings/`,
  `node_modules/` and `*.tgz`.

### Changed

- Scaffolded projects build on `@tradingview/lwc-toolkit` instead of shipping
  their own copies of the helper files. The toolkit is a devDependency, so the
  bundler inlines only the helpers a plugin uses.
- The `./standalone` export of a scaffolded project now declares its types, so
  TypeScript consumers importing it no longer see an implicit `any`.
- The type declarations of a scaffolded project no longer pull the whole
  Lightweight Charts™ library into the bundled `.d.ts`.
- The README template's CDN section uses import maps and covers more setups.
- The generated `package.json` follows the conventions of the Lightweight
  Charts™ plugin catalogue, so a published plugin can be listed there.
- Template dependencies updated: TypeScript 5.9 and current Vite,
  dts-bundle-generator and related tooling.
- This package is now licensed under Apache-2.0 (previously MIT), matching the
  rest of the repository.
