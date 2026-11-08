# Timeline (`src/components/Timeline`)

## Vocabulary
- **Gutter**: the gap before a segment (crop start or cut) holding the icons of carried casts. In code: `TimeMap.gaps`, `FightRow.update_gaps`, `Cast.gutter_slot`. Look: `GUTTER_*` in `constants.ts`.
- **Ruler** of a dungeon run: `PullRow.ts`. The shared top ruler is `Ruler.ts`.
- **Row background**: `PlayerRowBackground.ts` (drawn per segment, so gutters stay empty).

## Checking a change in the browser
- Dev server: `http://localhost:9001` (not 3000), usually already running: check with `lsof -i :9001` and reuse it. Start your own only if it's down (or for a worktree), and stop it with `kill $(lsof -ti :PORT)` (`pkill -f` matches your own shell).
- Test report: `/user_report/M2hG3PrzQWdCnL9K?fight=4.5&player=1.4&variant=B` (dungeon run, KR+23).
- Raid/phases: `/spec_ranking/druid-restoration/entombed-sentinels`.
- Pull selection isn't in the URL: open the run's pull select (arrow next to the key level), click pulls, set unselected pulls to Hide for cuts. Reloading resets it.
- Gutters only show when casts from before a crop or cut reach into it: enable spells in the Spells tab, and pick non-adjacent pulls (e.g. #3 and #8).
- Measure sizes, positions and colours with `javascript_tool` (`getBoundingClientRect`, `getComputedStyle`); take a screenshot when the question is how it looks (canvas drawing, overlaps, alignment by eye).
- Automated hover doesn't open the hover menus (filter menus, ruler corner, pull select): click to pin them open.
- Canvas and CSS changes: check them on a test URL before reporting done.
