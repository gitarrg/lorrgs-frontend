# 08: Player-names list renders only what changed

**What to build:** the 50 player name rows don't re-render unless their own fight or player changed. Remove the unused spell-display subscription in the player name component, and memoize the name and fight components.

**Blocked by:** 01 (done: fights load once, so fight objects stay stable)

**Status:** ready-for-agent

- [ ] Toggling spells or display settings doesn't re-render the player names (check in the profiler)
- [ ] Filters still hide and show rows correctly
