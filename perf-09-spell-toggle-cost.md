# 09: Profile and speed up spell toggles

**What to build:** toggling a spell or spell group feels instant. First capture a profile of only spell toggles. Today each toggle sends two events to the stage (spell display, then filters), each walking every row, and rebuilds the cache of every player.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] A profile of only spell toggles is captured, before and after the change
- [ ] Each toggle sends the stage a single update, and only affected rows rebuild their cache
