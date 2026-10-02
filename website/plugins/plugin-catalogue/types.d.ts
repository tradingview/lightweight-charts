// The catalogue data contract, produced by scripts/plugins/catalogue-data.mjs.
// Pages read the summaries through usePluginCatalogue(); a full entry, README
// included, is written per plugin by createData in this plugin's contentLoaded.
export type {
	CatalogueData,
	CatalogueEntry,
	CatalogueEntrySummary,
	CatalogueGlobalData,
	LwcPluginMetadata,
} from '../../../scripts/plugins/catalogue-data.mjs';
