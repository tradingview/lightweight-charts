import { usePluginData } from '@docusaurus/useGlobalData';

import type { CatalogueGlobalData } from '../../plugins/plugin-catalogue/types';

/** The plugin catalogue, without READMEs; see plugins/plugin-catalogue/README.md. */
export function usePluginCatalogue(): CatalogueGlobalData {
	return usePluginData('lwc-plugin-catalogue') as CatalogueGlobalData;
}
