// The theme switch repaints the page at once, but elements that transition
// their colors (the catalog cards, for their hover state) would fade into the
// new theme instead and lag behind everything around them. Transitions are
// switched off for the frames of the switch; see `.theme-switching` in
// custom.css.
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

if (ExecutionEnvironment.canUseDOM) {
	const root = document.documentElement;
	new MutationObserver(() => {
		root.classList.add('theme-switching');
		// Two frames: the first paints the new colors, the second may restore
		// the transitions without animating to them.
		requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
	}).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
}
