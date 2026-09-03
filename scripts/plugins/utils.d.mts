export interface WorkspacePlugin {
	dir: string;
	packageJson: Record<string, any>;
	name: string;
	version: string | undefined;
}

export interface TargetOptions {
	path?: string;
	filter?: string;
}

export function findWorkspacePlugins(repoRoot: string, filter?: string): WorkspacePlugin[];

export function resolveTargetPlugins(repoRoot: string, options?: TargetOptions): WorkspacePlugin[];

export function loadTargetPlugins(repoRoot: string, options?: TargetOptions): WorkspacePlugin[];

export function compareVersions(
	localVersion: string,
	remoteVersion: string | null
): { isNewer: boolean; localVersion: string; remoteVersion: string | null };

export function parseRemoteVersionError(error: any, packageName: string): null;

export function getRemoteVersion(packageName: string): string | null;

export function verifyChangelog(
	changelogContent: string,
	version: string
): { valid: boolean; message?: string };

export function validatePackageMetadata(
	packageDir: string,
	options?: { isOfficial?: boolean }
): { valid: boolean; errors: string[] };

export function validateReadmeContent(content: string): { valid: boolean; errors: string[] };

export function extractReadmeSnippet(readmePath: string): { code: string; lang: 'ts' | 'js' };

export function verifyPackContent(
	tarballPath: string,
	packageJson: Record<string, any>
): { valid: boolean; errors: string[] };
