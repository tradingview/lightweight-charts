# Contributing to Lightweight Charts

## Issues

### Search for duplicates

[Search the existing issues](https://github.com/tradingview/lightweight-charts/search?type=Issues) before logging a new one.

_Don't_ restrict your search to only open issues. An issue with a title similar to yours may have been closed as a duplicate of one with a less-findable title.

### Filing an Issue

When logging a bug, please be sure to include the following:

- What version of the library you're using.
- If at all possible, an _isolated way_ to reproduce the behavior.
- The behavior you expect to see, and the actual behavior (e.g. screenshots).
- Make sure the issue title is understandable and searchable.

    _Bad_: Oh my god! This goddamn thing just blew up! Is that my torn off finger laying out there? Oh my freaking god!

    _Good_: ACME graphics card overheats and causes injuries when using the software

## Pull Requests

- Outside contributors may implement enhancement/features only _after an approval_ (label "help wanted") by Lightweight Charts project maintainers.
- For build instructions/suggestions see [BUILDING.md](./BUILDING.md).
- After the review process has started, please **don't** use rebase to update the branch, use merge instead.

    It's hard to track down the changes you made in previous commits if you do rebasing (and even determine if you really changed something).

### Tests

1. Every pull request should have an adequate tests whenever it's possible (we have several [type of tests](./tests/), so you can find what works best for your changes).
1. If your changes affect paining, then your changes should contain a test case (or test cases) for [graphics tests](./tests/e2e/graphics).
1. Your pull request should pass CI (except checks marked as "not required" - in this case a reviewer should pay attention to job's artifacts).

### Git commit messages

1. Please make sure that every your commit has a clear commit message (not just `fix bug` or something like this - describe what has been changed/fixed).

1. If your commit addresses a GitHub issue, feel free to add it somehow:

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
