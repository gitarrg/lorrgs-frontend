# 07: Collapse SpecRankings UI sync into one dispatch

**What to build:** the spec ranking page syncs mode, boss, spec, difficulty and metric into the store in a single update, instead of five separate effects. The page load then produces fewer commits.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Fewer commits on a fresh page load (compare with a profile taken before the change)
- [ ] Navigating between specs, bosses, difficulties and metrics still updates everything
