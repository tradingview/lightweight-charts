/**
 * Version used when the registry cannot be reached. Keep this roughly in step
 * with the released library; it only affects the default shown in the prompt.
 */
const FALLBACK_VERSION = '5.2.1';

const REGISTRY_URL = 'https://registry.npmjs.org/lightweight-charts/latest';
const TIMEOUT_MS = 3000;

/**
 * Looks up the current stable version of the library, so that the scaffolded
 * package can declare a sensible peer dependency range by default.
 */
export async function latestLibraryVersion(): Promise<string> {
	try {
		const response = await fetch(REGISTRY_URL, {
			signal: AbortSignal.timeout(TIMEOUT_MS),
			headers: { accept: 'application/json' },
		});
		if (!response.ok) return FALLBACK_VERSION;
		const body = (await response.json()) as { version?: unknown };
		if (typeof body.version === 'string' && /^\d+\.\d+\.\d+/.test(body.version)) {
			return body.version;
		}
		return FALLBACK_VERSION;
	} catch {
		return FALLBACK_VERSION;
	}
}
