# 04: Cheaper timeline stage build

**What to build:** opening a spec/boss page builds the timeline in well under 100 ms of effect time (it was about 300 ms). Candidates, depending on what ticket 03 finds:
- skip the rebuild when the fights haven't changed
- move player caching out of the build and into a frame or idle time, starting with visible rows
- stop making every event line listen for mouse events

**Blocked by:** 03

**Status:** in progress (big wins done; the target of under 100 ms isn't reached yet)

- [x] Effect time for the fights commit is measurably lower in a profile of a fresh page load
- [x] The timeline looks and behaves the same: tooltips, hover, zoom, spell toggles and filters

## Done (2026-10-30)

- **Resize before adding rows.** The stage is resized before the new rows are added, so Konva's synchronous resize redraw no longer draws ~1800 uncached nodes.
- **Idle-time caching.** Player caches are rebuilt in ≤10 ms idle-time slices, only once the icons have loaded, and only after zooming has settled for 300 ms. They used to be rebuilt synchronously on every redraw event, twice per page load. Players are drawn uncached until then; they look the same.
- **One mouse listener.** Casts share one listener on the main layer instead of three each.
- **No rebuild on loading flags.** The stage isn't rebuilt when only a loading flag changed. Before, every in-app spec switch rebuilt it once with the old fights. Rebuilds per fresh load went 4 → 2 (one empty), per spec switch 2 → 1.
- **Lighter cast text.** Cast times are drawn by a small text shape instead of `Konva.Text`. It's pixel-identical, checked by screenshot diff with and without a selected spell.
- **Caching after zoom.** Zooming now re-caches players (it used to leave them uncached, so every drag after a zoom was slow). Caches are capped at 4096 device pixels wide, since Konva allocates four canvases per cache. Wider rows (zoomed far in) stay uncached, as before.

## Measured

A/B of the same page against the previous commit: headless Chrome, dev build, 5 page loads each, medians.

| per page load | before | after |
|---|---|---|
| timeline work, total | 411 ms | 282 ms |
| timeline work in the largest single task | 324 ms | 162 ms |
| longest task that includes timeline work | 518 ms | 337 ms |

## Looked at, not worth it

- **Creating casts at the current zoom.** The zoom pass after the build is now ~20–25 ms. The ruler is ~13 ms of that, and it really needs re-laying out; casts are ~9 ms. Passing the zoom through four constructors isn't worth that.

## Next lever

- **Fewer Konva nodes per cast.** Each cast is 6 Konva nodes (group, cooldown bar, duration bar, icon, text, mouse box). Konva's per-node setup (listeners, attribute setters) now dominates construction, which is ~100–160 ms for ~300 casts: even the lighter text shape still costs ~30–45 ms. Drawing a whole cast in one custom shape would cut construction to a fraction. The parts' visibility, opacity and the hover/click box then have to be handled inside that shape. It's a bigger change; do it as its own ticket.
- **Sub-pixel shift when a cache arrives.** After a zoom, a row can shift by under a pixel when its cache arrives, because Konva snaps caches to whole pixels. This is the same rendering as after a page load. Only worth looking at if someone notices it.
