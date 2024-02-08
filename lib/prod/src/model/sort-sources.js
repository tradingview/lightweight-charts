import { ensureNotNull } from '../helpers/assertions';
export function sortSources(sources) {
    return sources.slice().sort((s1, s2) => {
        return (ensureNotNull(s1._internal_zorder()) - ensureNotNull(s2._internal_zorder()));
    });
}
