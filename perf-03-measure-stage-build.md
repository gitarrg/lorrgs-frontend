# 03: Measure where a timeline stage build spends its time

**What to build:** a short breakdown of one full timeline build (when a page's fights arrive) into node construction, layout, image loading, caching and drawing. The profiler shows about 270–390 ms of effect time per build (dev mode). This breakdown decides how ticket 04 is approached.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Timings for each phase of a stage build are recorded on a real spec ranking page
- [x] The dominant cost(s) are written down at the bottom of this note

## Findings (2026-10-30, dev build, headless Chrome, fire mage / Nymrissa, 50 fights, 51 rows)

The fights effect ran as one task of about 330–420 ms, plus a second task of 65–145 ms when the spell icons finished loading.

| Phase | ms | Cause |
|---|---|---|
| Building Konva nodes | 100–155 | about 85 in `Cast` constructors: `Konva.Text` text measuring ~35, three mouse listeners per cast ~21 |
| Stage layout | 80–110 | setting the stage height makes Konva resize, which synchronously draws every layer (~50–70 for the uncached main layer) |
| Zoom event | ~25 | positions every cast |
| Display-settings event | 105–130 | `cache()` on all 51 players (~100–120) |
| Images-loaded event (later task) | 65–145 | `cache()` on all 51 players again; the first cache is thrown away |

Most of the `cache()` cost is allocating the offscreen scene and hit canvases (`setWidth`/`setHeight`).
Once cached, the main layer draws in about 1 ms instead of 50–70 ms, so the cache is worth keeping. It just shouldn't be built more than once per build.
