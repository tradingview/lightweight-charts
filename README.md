<!-- markdownlint-disable no-inline-html first-line-h1 -->

<div align="center">
  <a href="https://www.tradingview.com/lightweight-charts/" target="_blank">
    <img width="200" src="https://github.com/tradingview/lightweight-charts/raw/master/.github/logo.svg?sanitize=true" alt="Lightweight Charts logo">
  </a>

  <h1>Lightweight Charts™</h1>

  [![CircleCI][ci-img]][ci-link]
  [![npm version][npm-version-img]][npm-link]
  [![npm bundle size][bundle-size-img]][bundle-size-link]
  [![Dependencies count][deps-count-img]][bundle-size-link]
  [![Downloads][npm-downloads-img]][npm-link]
  [![pkg.pr.new][pkg-pr-new-img]][pkg-pr-new-link]
</div>

<!-- markdownlint-enable no-inline-html -->

[Demos][demo-url] | [Documentation](https://tradingview.github.io/lightweight-charts/) | [Reddit](https://www.reddit.com/r/TradingView/)

TradingView Lightweight Charts™ are one of the smallest and fastest financial HTML5 charts.

The Lightweight Charts™ library is the best choice for you if you want to display financial data as an interactive chart on your web page without affecting your web page loading speed and performance.

It is the best choice for you if you want to replace static image charts with interactive ones.
The size of the library is close to static images but if you have dozens of image charts on a web page then using this library can make the size of your web page smaller.

Take a look at [awesome-tradingview](https://github.com/tradingview/awesome-tradingview?tab=readme-ov-file#lightweight-charts) for related projects created by our community members.

The library provides a rich set of charting capabilities out of the box, but developers can also extend its functionality by building custom plugins. See the [interactive plugin examples here](https://tradingview.github.io/lightweight-charts/plugin-examples/), or check out [plugin-examples/README.md](https://github.com/tradingview/lightweight-charts/tree/master/plugin-examples) for more details.

## Installing

### es6 via npm

```bash
npm install lightweight-charts
```

### Latest master build

To try the latest `master` build without waiting for a release (powered by [pkg.pr.new](https://pkg.pr.new)):

```bash
npm install https://pkg.pr.new/lightweight-charts@master
```

The import and usage below applies to both npm installation options:

```js
import { createChart, LineSeries } from 'lightweight-charts';

const chart = createChart(document.body, { width: 400, height: 300 });
const lineSeries = chart.addSeries(LineSeries);
lineSeries.setData([
    { time: '2019-04-11', value: 80.01 },
    { time: '2019-04-12', value: 96.63 },
    { time: '2019-04-13', value: 76.64 },
    { time: '2019-04-14', value: 81.89 },
    { time: '2019-04-15', value: 74.43 },
    { time: '2019-04-16', value: 80.01 },
    { time: '2019-04-17', value: 96.63 },
    { time: '2019-04-18', value: 76.64 },
    { time: '2019-04-19', value: 81.89 },
    { time: '2019-04-20', value: 74.43 },
]);
```

### CDN

You can use [unpkg](https://unpkg.com/):

<https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js>

The standalone version creates `window.LightweightCharts` object with all exports from `esm` version:

```js
const chart = LightweightCharts.createChart(document.body, { width: 400, height: 300 });
const lineSeries = chart.addSeries(LightweightCharts.LineSeries);
lineSeries.setData([
    { time: '2019-04-11', value: 80.01 },
    { time: '2019-04-12', value: 96.63 },
    { time: '2019-04-13', value: 76.64 },
    { time: '2019-04-14', value: 81.89 },
    { time: '2019-04-15', value: 74.43 },
    { time: '2019-04-16', value: 80.01 },
    { time: '2019-04-17', value: 96.63 },
    { time: '2019-04-18', value: 76.64 },
    { time: '2019-04-19', value: 81.89 },
    { time: '2019-04-20', value: 74.43 },
]);
```

### Build Variants

|Dependencies included|Mode|ES module|IIFE (`window.LightweightCharts`)|
|-|-|-|-|
|No|PROD|`lightweight-charts.production.mjs`|N/A|
|No|DEV|`lightweight-charts.development.mjs`|N/A|
|Yes (standalone)|PROD|`lightweight-charts.standalone.production.mjs`|`lightweight-charts.standalone.production.js`|
|Yes (standalone)|DEV|`lightweight-charts.standalone.development.mjs`|`lightweight-charts.standalone.development.js`|

## AI coding assistants

This repository ships an [Agent Skill](https://github.com/tradingview/lightweight-charts/blob/master/.github/skills/lightweight-charts/SKILL.md) that teaches AI coding assistants how to work with Lightweight Charts™ - the v5 API conventions, the mental model, and the common time, scale, marker, plugin, and wrapper foot-guns.

Install it into your project with the `skills` CLI:

```console
npx skills add https://github.com/tradingview/lightweight-charts
```

This makes the skill available to compatible assistants (such as Claude Code, Codex, etc.), streamlining your workflow: they scaffold charts, wire up series and data, and answer API questions against the current v5 conventions out of the box - instead of relying on outdated snippets and stumbling into common foot-guns.

## Development

See [BUILDING.md](./BUILDING.md) for instructions on how to build `lightweight-charts` from source.

## License

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this software except in compliance with the License.
You may obtain a copy of the License at LICENSE file.
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

This software incorporates several parts of tslib (<https://github.com/Microsoft/tslib>, (c) Microsoft Corporation) that are covered by BSD Zero Clause License.

This license requires specifying TradingView as the product creator.
You shall add the "attribution notice" from the NOTICE file and a link to <https://www.tradingview.com/> to the page of your website or mobile application that is available to your users.
As thanks for creating this product, we'd be grateful if you add it in a prominent place.
You can use the [`attributionLogo`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LayoutOptions#attributionLogo) chart option for displaying an appropriate link to <https://www.tradingview.com/> on the chart itself, which will satisfy the link requirement.

[demo-url]: https://www.tradingview.com/lightweight-charts/

[ci-img]: https://img.shields.io/circleci/build/github/tradingview/lightweight-charts.svg
[ci-link]: https://circleci.com/gh/tradingview/lightweight-charts

[npm-version-img]: https://badge.fury.io/js/lightweight-charts.svg
[npm-downloads-img]: https://img.shields.io/npm/dm/lightweight-charts.svg
[npm-link]: https://www.npmjs.com/package/lightweight-charts

[bundle-size-img]: https://badgen.net/bundlephobia/minzip/lightweight-charts
[deps-count-img]: https://img.shields.io/badge/dynamic/json.svg?label=dependencies&color=brightgreen&query=$.dependencyCount&uri=https%3A%2F%2Fbundlephobia.com%2Fapi%2Fsize%3Fpackage%3Dlightweight-charts
[bundle-size-link]: https://bundlephobia.com/result?p=lightweight-charts
[pkg-pr-new-img]: https://pkg.pr.new/badge/tradingview/lightweight-charts
[pkg-pr-new-link]: https://pkg.pr.new/~/tradingview/lightweight-charts


## 🌐 Web Resources & Interactive Index
- [COLOR BLOCK JAM 2](https://learnquesters.pages.dev/color-block-jam-2.html)
- [BOXTERIA](https://studyplaying.github.io/boxteria.html)
- [CATEGORY MERGE 2](https://themindskillplayplay.pages.dev/category-merge-2.html)
- [MEOW BLOCK COLOR COLLECT](https://studyplayings.pages.dev/meow-block-color-collect.html)
- [FURY ROAD ZOMBIE CRASH](https://studyplayings.pages.dev/fury-road-zombie-crash.html)
- [BRAINROT MERGE](https://learnquester.pages.dev/brainrot-merge.html)
- [CATEGORY BATTLE GAMES](https://studyplaying.github.io/category-battle-games.html)
- [CATEGORY MINECRAFT81](https://studyquests.pages.dev/category-minecraft81.html)
- [UNLOCK THE BOLTS](https://studyquests.pages.dev/unlock-the-bolts.html)
- [ROBOTS GONE WILD](https://studyquests.pages.dev/robots-gone-wild.html)
- [CANDY SMASH](https://studyquests.pages.dev/candy-smash.html)
- [CATEGORY GROW99](https://studyquests.pages.dev/category-grow99.html)
- [PIN MASTER](https://studyquests.pages.dev/pin-master.html)
- [INDEX3](https://studyplayings.pages.dev/index3.html)
- [SNOWBOARD GAME PARTY](https://studyquests.pages.dev/snowboard-game-party.html)
- [WAR LANDS](https://studyplayings.pages.dev/war-lands.html)
- [CATEGORY CASUAL](https://learnquester.pages.dev/category-casual.html)
- [ARCADE ROPE](https://studyplayings.pages.dev/arcade-rope.html)
- [DESTRUCTION SIMULATOR](https://studyquests.pages.dev/destruction-simulator.html)
- [CATEGORY POINT AND CLICK123](https://studyplayings.pages.dev/category-point-and-click123.html)
- [CATEGORY MERGE GAMES](https://studyquests.pages.dev/category-merge-games.html)
- [STRIKE BREAKOUT](https://studyquests.pages.dev/strike-breakout.html)
- [CATEGORY SIMULATION 3](https://studyplayings.pages.dev/category-simulation-3.html)
- [TUNG TUNG SAHUR COLORING BOOK](https://studyquests.pages.dev/tung-tung-sahur-coloring-book.html)
- [MACHINE CITY BALLS](https://studyquests.pages.dev/machine-city-balls.html)
- [ENCHANTED MAHJONG SAGA](https://studyplayings.pages.dev/enchanted-mahjong-saga.html)
- [MAX MIXED COCKTAILS](https://studyquests.pages.dev/max-mixed-cocktails.html)
- [CATEGORY PARTY23](https://studyplayings.pages.dev/category-party23.html)
- [CATEGORY BLOCK94](https://studyplaying.github.io/category-block94.html)
- [CATEGORY RPG80](https://studyplayings.pages.dev/category-rpg80.html)
- [PYRAMID SOLITAIRE ANCIENT EGYPT](https://studyplayings.web.app/pyramid-solitaire-ancient-egypt.html)
- [CATEGORY MAKEUP51](https://studyplayings.pages.dev/category-makeup51.html)
- [BUBBITS](https://quizverses-9d2f2.web.app/bubbits.html)
- [HAZEL TANGLE ROPE 3D SORTING PUZZLE](https://studyquests.github.io/hazel-tangle-rope-3d-sorting-puzzle.html)
- [CATEGORY 2D1 070](https://learnquester.pages.dev/category-2d1-070.html)
- [FISH EAT GROW MEGA](https://studyplayings.pages.dev/fish-eat-grow-mega.html)
- [CATEGORY MONSTER206](https://studyquests.pages.dev/category-monster206.html)
- [INDEX15](https://learnquester.pages.dev/index15.html)
- [DELICIOUS EMILYS NEW BEGINNING VALENTINES EDITION](https://quizverses-9d2f2.web.app/delicious-emilys-new-beginning-valentines-edition.html)
- [MINICRAFT WINTERBLOCK](https://studyplayings.pages.dev/minicraft-winterblock.html)
- [EGG ADVENTURE](https://studyquests.github.io/egg-adventure.html)
- [WARFRONT](https://studyquests.github.io/warfront.html)
- [TRY TO COUNT THE BOXES BRAIN TRAINING](https://learnquester.pages.dev/try-to-count-the-boxes-brain-training.html)
- [MY FARM LIFE](https://studyplayings.pages.dev/my-farm-life.html)
- [JUICE MERGE](https://themindzone.pages.dev/juice-merge.html)
- [GRASS DEFENSE](https://studyquests.pages.dev/grass-defense.html)
- [SUDOKU VAULT](https://studyquests.github.io/sudoku-vault.html)
- [BUBBLE BLITZ GALAXY](https://thequizzone.pages.dev/bubble-blitz-galaxy.html)
- [AUTO NINJA](https://thelearnquesters.pages.dev/auto-ninja.html)
- [CATEGORY LISTS](https://studyplayings.pages.dev/category-lists.html)
- [CATEGORY AGILITY](https://studyquests.github.io/category-agility.html)
- [ROPE STITCH PUZZLE](https://quizverses-9d2f2.web.app/rope-stitch-puzzle.html)
- [LAST UFO DEFENSE](https://studyquests.pages.dev/last-ufo-defense.html)
- [SUDOKU VAULT](https://quizverses.github.io/sudoku-vault.html)
- [MONSTER SCHOOL 2](https://studyquesthub.web.app/monster-school-2.html)
- [HORROR ESCAPE GRANNY ROOM](https://themindplay.github.io/horror-escape-granny-room.html)
- [AMMO RUSH MASTER](https://thequizzone.pages.dev/ammo-rush-master.html)
- [HEROES OF THE ARENA](https://studyquests.github.io/heroes-of-the-arena.html)
- [STICKMAN KOMBAT 2D](https://studyplayings.pages.dev/stickman-kombat-2d.html)
- [CATEGORY DRAWING](https://themindplay.github.io/category-drawing.html)
- [EVERYTHING IS IN PLACE RARE FINDS](https://iskillquest.pages.dev/everything-is-in-place-rare-finds.html)
- [NOOB ARCHER VS STICKMAN ZOMBIE ZOMBIE SHOOTER](https://thequizzone.pages.dev/noob-archer-vs-stickman-zombie-zombie-shooter.html)
- [STICKMAN JAILBREAK STORY](https://thequizzone.pages.dev/stickman-jailbreak-story.html)
- [OFFROAD LIFE 3D](https://learnquester.pages.dev/offroad-life-3d.html)
- [BACTERIA LIFE DEATH](https://studyplayings.web.app/bacteria-life-death.html)
- [CHRISTMAS SORTING](https://quizverses.github.io/christmas-sorting.html)
- [LOVE TILE TRIO](https://thequizzone.pages.dev/love-tile-trio.html)
- [JEWEL DRESS UP](https://iskillquest.pages.dev/jewel-dress-up.html)
- [QUEENS ROYAL SUDOKU PUZZLE](https://studyplayings.web.app/queens-royal-sudoku-puzzle.html)
- [TOSS THE RING](https://studyplayings.pages.dev/toss-the-ring.html)
- [SLAP AND RUN](https://quizverses-9d2f2.web.app/slap-and-run.html)
- [CATEGORY TANK58](https://studyplayings.web.app/category-tank58.html)
- [ANIME DRESS UP DOLL DRESS UP](https://themindplay.github.io/anime-dress-up-doll-dress-up.html)
- [STOCKINGS DILEMMA](https://themindplay.github.io/stockings-dilemma.html)
- [COMBINATIONS DAILY](https://thequizzone.pages.dev/combinations-daily.html)
- [ZINDEX](https://iskillquest.pages.dev/zindex.html)
- [WACKY STRIKE](https://thelearnquesters.pages.dev/wacky-strike.html)
- [FISHING BARON REAL FISHING](https://theskillquest.pages.dev/fishing-baron-real-fishing.html)
- [HAPPY BLOCKS](https://studyplaying.github.io/happy-blocks.html)
- [BARREL ROLLER AMAZING RUNNER](https://themindplay.github.io/barrel-roller-amazing-runner.html)
- [INDEX3](https://learnquester.pages.dev/index3.html)
- [CATEGORY ARMY40](https://studyquests.github.io/category-army40.html)
- [LIFE CLICKER](https://themindplay.github.io/life-clicker.html)
- [CATEGORY BASKETBALL](https://studyquests.github.io/category-basketball.html)
- [CHESSFIELD](https://iskillquest.pages.dev/chessfield.html)
- [CARDS KLONDIKE SOLITAIRE](https://themindzone.pages.dev/cards-klondike-solitaire.html)
- [CANDY RIDDLES](https://themindplay.github.io/candy-riddles.html)
- [TABLE TENNIS OPEN](https://themindplay.github.io/table-tennis-open.html)
- [DATA DIGGERS](https://thequizzone.pages.dev/data-diggers.html)
- [BOOM LAND LITE](https://themindzone.pages.dev/boom-land-lite.html)
- [PERFECT SHOT](https://studyplayings.web.app/perfect-shot.html)
- [GALACTIC CRUSADE CLICKER](https://quizverses.github.io/galactic-crusade-clicker.html)
- [CATEGORY LOGIC538](https://studyquests.pages.dev/category-logic538.html)
- [MY TINY LAND](https://studyquests.github.io/my-tiny-land.html)
- [SITEMAP](https://thelearnquesters.pages.dev/sitemap.html)
- [INDEX30](https://themindplay.pages.dev/index30.html)
- [FLAG PUZZLE JAM COLLECT FLAGS](https://studyplayings.pages.dev/flag-puzzle-jam-collect-flags.html)
- [CATEGORY ARENA255](https://studyplaying.github.io/category-arena255.html)
- [SUMMER SPOTLIGHT DIFFERENCES](https://studyplayings.web.app/summer-spotlight-differences.html)
- [CAR OUT JAM](https://quizverses.github.io/car-out-jam.html)
- [CATEGORY CAN T STOP PLAYING215](https://studyquests.pages.dev/category-can-t-stop-playing215.html)
- [CATEGORY SCRATCH17](https://studyplayings.web.app/category-scratch17.html)
- [CATEGORY CASUAL 14](https://quizverses.github.io/category-casual-14.html)
- [CATEGORY ADVENTURE](https://studyplayings.web.app/category-adventure.html)
- [SWORD AND JEWEL](https://iskillquest.pages.dev/sword-and-jewel.html)
- [MATH STARS](https://themindzone.pages.dev/math-stars.html)
- [UNSCREW WOOD PUZZLE](https://studyplaying.github.io/unscrew-wood-puzzle.html)
- [BANANA FARM](https://quizverses-9d2f2.web.app/banana-farm.html)
- [FRUIT BLOCK TETRA PUZZLE](https://themindplay.github.io/fruit-block-tetra-puzzle.html)
- [FURY TANKS](https://themindplay.pages.dev/fury-tanks.html)
- [CATEGORY ZOMBIE175](https://thelearnquesters.pages.dev/category-zombie175.html)
- [CATEGORY SPACE](https://quizverses.pages.dev/category-space.html)
- [IMPOSTER COLORING BOOK](https://thequizzone.pages.dev/imposter-coloring-book.html)
- [PUZZLE BLOCKS](https://thequizzone.pages.dev/puzzle-blocks.html)
- [BRAWL STARS BATTLE](https://studyplaying.github.io/brawl-stars-battle.html)
- [LOST PUPPY RESCUE AND CARE](https://studyquests.github.io/lost-puppy-rescue-and-care.html)
- [SUSTAINABLE](https://themindzone.pages.dev/sustainable.html)
- [FIND HIDDEN SECRETS](https://themindplay.github.io/find-hidden-secrets.html)
- [BIMKA DRIVE SMASH CARS INTO SPLINTERS](https://thequizzone.pages.dev/bimka-drive-smash-cars-into-splinters.html)
- [CHALLENGER CITY DRIVER](https://studyplayings.web.app/challenger-city-driver.html)
- [2 PLAYER BATTLE](https://themindzone.pages.dev/2-player-battle.html)
- [CRYPTOGRAPH](https://thelearnquester.web.app/cryptograph.html)
- [CATEGORY POINT AND CLICK124](https://themindzone.pages.dev/category-point-and-click124.html)
- [BLOCK PIXEL GUN APOCALYPSE 3](https://themindzone.pages.dev/block-pixel-gun-apocalypse-3.html)
- [MATCH 3D PUZZLE SAGA](https://quizverses.github.io/match-3d-puzzle-saga.html)
- [BEAM DRIVE CAR CRASH TEST SIMULATOR](https://themindzone.pages.dev/beam-drive-car-crash-test-simulator.html)
- [HUGGY MIX SPRUNKI MUSIC BOX](https://learnquesters.pages.dev/huggy-mix-sprunki-music-box.html)
- [CUTE SHEEP SKYBLOCK](https://thelearnquester.web.app/cute-sheep-skyblock.html)
- [SURVIVAL MASTER 456 CHALLENGE](https://themindplay.github.io/survival-master-456-challenge.html)
- [ROBOCARPOLI](https://studyplayings.pages.dev/robocarpoli.html)
