# 07: Collapse SpecRankings UI sync into one dispatch

**What to build:** the spec ranking page syncs mode, boss, spec, difficulty and metric into the store in a single update, instead of five separate effects. The page load then produces fewer commits.

**Blocked by:** None (can start immediately)

**Status:** closed: one action wouldn't reduce commits; one redundant dispatch removed

- [ ] Fewer commits on a fresh page load (compare with a profile taken before the change)
- [ ] Navigating between specs, bosses, difficulties and metrics still updates everything

## Findings (2026-10-30)

I traced which store actions land in each React commit. The five UI-sync dispatches (`set_mode`, `set_boss_slug`, `set_spec_slug`, `set_difficulty` and `set_metric`) already land in **one** commit, together with the filter setup and the first loading flags. React batches dispatches made from effects in the same flush. Folding them into one action would add a reducer without saving a commit.

- **Done:** the metric-sync effect depended on the whole spec object, so it dispatched `set_metric` again whenever the spec's spells arrived. It now depends only on the metric.
- **Not done:** the real extra commit is structural. The page first renders with the store's previous spec/boss/difficulty, and the sync effects then update the store, which causes a second render. Removing that means reading these values from the route instead of the store, which is a bigger change. Since ticket 06, that second render only reaches components that show those values.
