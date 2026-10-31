# 10: Draw each cast as one shape

**What to build:** each cast is one Konva shape instead of 6 nodes (group, cooldown bar, duration bar, icon, text, mouse box). Konva's per-node setup dominates the stage build: ~100–160 ms for ~300 casts (see ticket 04, "Next lever").

**Blocked by:** 04

**Status:** in progress

## How it looks

- Visually the same as before, not necessarily pixel-identical. Checked by a screenshot diff of before/after (with and without a selected spell, each display toggle), reviewing every spot that differs.
- Procs stay dimmed (0.5) and without a cooldown bar.
- Selected and dimmed styles are unchanged.

## How it behaves

- **Hit area** covers the visible label parts: the icon (0 → 27) and the full time text (27 → 27 + text width + 3). Before, the box was (text width + 3) wide from 0, so it cut off part of the text.
- With both icon and text hidden, the duration bar is the hit area. Without a (visible) duration bar, the cast doesn't catch the mouse. The cooldown bar never does.
- **Hover** doesn't change the cast's look (a highlight was tried and dropped): only the cursor and tooltip.
- Unchanged: tooltip content and position (centered above the icon), cursor, click to select, ctrl+click to add to the selection, display toggles, zoom.

## Acceptance

- [ ] Construction time for casts is measurably lower in a profile of a fresh page load
- [ ] Screenshot diff reviewed: only anti-aliasing-level differences
- [ ] Tooltips, hover highlight, click/ctrl+click selection, display toggles, spell toggles and zoom work as described above
