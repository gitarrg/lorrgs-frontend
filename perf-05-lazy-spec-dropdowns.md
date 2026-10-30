# 05: Mount spec dropdowns only when open

**What to build:** the navbar's spec dropdowns (40 spec buttons across 4 roles) only render while a dropdown is open. Today they're mounted all the time and re-render on every commit during page load, about 150 of the roughly 334 fibers each time.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Closed dropdowns render no spec buttons (check with React DevTools)
- [x] Hover/open behaviour and the active-spec highlight still work

## Done (2026-10-30)

The role button tracks hover itself and only mounts its dropdown while hovered. Checked in headless Chrome, dev build, against the previous commit:

| | before | after |
|---|---|---|
| component renders during a page load | 2192 | 1372 |
| spec buttons rendered during a page load | 200 | 0 |
| spec links in the DOM | 40 | 0 (≈10 while a dropdown is open) |

The dropdown opens on hover, stays open while moving into it, closes on leave, and still marks the current spec as active.

The spec icons in a dropdown now load on its first hover instead of with the page, so they can pop in once.
