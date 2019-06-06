# Contributing to Lightweight Charts

## Issues

### Search for duplicates

[Search the existing issues](https://github.com/tradingview/lightweight-charts/search?type=Issues) before logging a new one.

*Don't* restrict your search to only open issues. An issue with a title similar to yours may have been closed as a duplicate of one with a less-findable title.

### Logging a bug

When logging a bug, please be sure to include the following:

- What version of the library you're using.
- If at all possible, an *isolated way* to reproduce the behavior.
- The behavior you expect to see, and the actual behavior (e.g. screenshots).

## Pull requests

For build instructions/suggestions see [BUILDING.md](./BUILDING.md).

### Tests

1. Every pull request should have an adequate tests whenever it's possible (we have several [type of tests](./tests/), so you can find what better fit for your changes).
1. If you change something affects painting, your changes should have a test case(s) for [graphics tests](./tests/e2e/graphics).
1. Your pull request should have passed CI (except checks marked as "not required" - in this case reviewer should pay attention on job's artifacts).

### Git commit messages

1. Please make sure that every of your commits have clear commit message (not just `fix bug` or something - describe a little what's changed/fixed).

1. If your commit addressed to GitHub issue (or even for a comment), feel free to add it somehow:

    - `Fixed bug in the method getFoo #42`
    - `Fixed bug with ... (fixes #42)`

    - ```text
        Fixed bug with rendering

        See LINK_TO_COMMENT
        ```

1. Useful links:

    - <https://www.conventionalcommits.org/>
    - <http://karma-runner.github.io/1.0/dev/git-commit-msg.html>
    - <https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716>
