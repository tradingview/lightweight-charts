/**
 * The npm scope and the package names this fork publishes under.
 *
 * The fork is published under the `@bishopbot` scope; upstream TradingView keeps
 * the unscoped `lightweight-charts` and the `@tradingview` scope. Every script
 * that has to know a package name reads it from here, so that a rename is a
 * one-line change rather than a search across the tooling.
 */
export const SCOPE = '@bishopbot';

/** The library package, published as `@bishopbot/lightweight-charts`. */
export const LIBRARY_PACKAGE = `${SCOPE}/lightweight-charts`;

/** The shared plugin helper package, published as `@bishopbot/lwc-toolkit`. */
export const TOOLKIT_PACKAGE = `${SCOPE}/lwc-toolkit`;

/** The private preview kit, used by the catalogue preview pages. */
export const PREVIEW_KIT_PACKAGE = `${SCOPE}/lwc-plugin-preview-kit`;

/**
 * The upstream library package name. It is not imported by the fork's packages
 * at runtime, but it stays an optional peer dependency so that a consumer who
 * already depends on the upstream 5.x line is not forced to change anything.
 */
export const UPSTREAM_LIBRARY_PACKAGE = 'lightweight-charts';
