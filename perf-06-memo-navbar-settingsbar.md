# 06: Keep Navbar and settings bar out of load-cascade renders

**What to build:** commits caused by loading flags, spell loads or fights arriving no longer re-render the Navbar or the settings bar unless something they show actually changed.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] In a profile of a fresh page load, Navbar and settings bar are absent from commits that don't affect them

## Done (2026-10-30)

- **Navbar and the settings bars are memoized.** They take no props, so the page's own re-renders (loading flags, spells arriving) stop at them. This covers the spec, comp and report settings bars.
- **The navbar selects only what it shows.** The boss buttons, the boss list items in raid dropdowns and the role buttons now select the current spec's slug. The metric menu selects the spec's role. They used to select the whole spec object, which is replaced when its spells load.

Measured with a per-commit render trace (headless Chrome, dev build, fire mage / Nymrissa):

| | before | after |
|---|---|---|
| component renders, spec page load | 1372 | 739 |
| … of those in Navbar | 429 | 138 |
| … of those in the settings bar | 505 | 163 |
| renders in the commit where the spec's spells arrive | 158 | 13 |
| renders in the `fights=true` loading-flag commit | 158 | 13 |
| component renders, comp page load | 586 | 303 |

The Navbar now renders only when the route, spec, boss, difficulty or mode changes. After switching specs in the app, the boss links, the active role and the metric are correct.
