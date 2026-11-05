import type { PropSidebarItem, PropSidebarItemCategory, PropSidebarItemLink } from '@docusaurus/plugin-content-docs';
import { useDocsSidebar } from '@docusaurus/plugin-content-docs/client';

export interface ExampleCategory {
	label: string;
	examples: PropSidebarItemLink[];
}

function collectLinks(items: PropSidebarItem[]): PropSidebarItemLink[] {
	return items.flatMap((item: PropSidebarItem) => {
		if (item.type === 'link' && item.docId) {
			return [item];
		}
		if (item.type === 'category') {
			return collectLinks(item.items);
		}
		return [];
	});
}

/**
 * The gallery categories in sidebar order: one per folder under `examples/`,
 * with the example pages in it.
 */
export function useExampleCategories(): ExampleCategory[] {
	const sidebar = useDocsSidebar();
	return (sidebar?.items ?? [])
		.filter((item: PropSidebarItem): item is PropSidebarItemCategory => item.type === 'category')
		.map((category: PropSidebarItemCategory) => ({
			label: category.label,
			examples: collectLinks(category.items),
		}))
		.filter((category: ExampleCategory) => category.examples.length > 0);
}

/** The label of the category an example page belongs to. */
export function useExampleCategoryLabel(docId: string): string | null {
	const categories = useExampleCategories();
	const category = categories.find((c: ExampleCategory) => c.examples.some((item: PropSidebarItemLink) => item.docId === docId));
	return category?.label ?? null;
}
