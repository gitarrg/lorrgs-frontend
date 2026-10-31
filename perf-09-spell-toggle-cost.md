# 09: Profile and speed up spell toggles

**What to build:** toggling a spell or spell group feels instant. First capture a profile of only spell toggles. Today each toggle sends two events to the stage (spell display, then filters), each walking every row, and rebuilds the cache of every player.

**Blocked by:** 04

**Status:** done

- [x] A profile of only spell toggles is captured, before and after the change
- [x] Each toggle sends the stage a single update, and only affected rows rebuild their cache

## Done (2026-10-31)

- **Only toggled rows update.** A spell toggle only re-lays out and redraws rows that have a cast of that spell. Before, every row dropped its cache, so the next frame drew the whole timeline uncached and every cache was then rebuilt.
- **Caches are redrawn in place.** A row whose look changes (spell toggle, selection, display settings) redraws its existing cache canvases right away, instead of dropping them and rebuilding later. Konva's `cache()` allocates four new canvases each time, which was about two thirds of its cost. After a zoom the cached area changes, so those rows still rebuild once the zoom settles. This relies on Konva internals (9.3.22), noted in the code.
- **The cache covers the row's clip**, plus a 1px margin, instead of the bounds of its visible casts. Those bounds changed with every toggle, and could reach past the visible area. A fixed area also lets rows whose casts are all hidden keep their cache for when casts come back.
- **One stage event per toggle.** Filters only re-run after a toggle when "hide empty rows" is on, the only filter that depends on spell display. Toggles and selections only redraw the layer the casts are on.

Measured on fire mage / Nymrissa: headless Chrome, dev build, 12 real clicks on spell buttons, medians, against the previous commit.

| per toggle | before | after |
|---|---|---|
| main-thread work, spell cast by every row | 433 ms | 176 ms |
| main-thread work, spell cast by few rows | 392 ms | 147 ms |
| click to next frame, every row | 68 ms | 60 ms |
| click to next frame, few rows | 66 ms | 50 ms |

The remaining time is mostly headless Chrome's software compositing (it copies every layer canvas each frame), which a GPU browser doesn't pay. The JavaScript per toggle is now ~50 ms, of which redrawing 50 caches is ~18 ms.

Checked against the previous commit by screenshot:
- toggling, selecting, "hide empty rows" (hide everything, then re-show a spell 9 players cast) and toggling while zoomed;
- the differences are at most 11 colour steps, from canvas resampling. Both builds are equally close to a fully uncached drawing.

Hover and click still work through the redrawn hit canvas.
