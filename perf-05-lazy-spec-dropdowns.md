# 05: Mount spec dropdowns only when open

**What to build:** the navbar's spec dropdowns (40 spec buttons across 4 roles) only render while a dropdown is open. Today they're mounted all the time and re-render on every commit during page load, about 150 of the roughly 334 fibers each time.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Closed dropdowns render no spec buttons (check with React DevTools)
- [ ] Hover/open behaviour and the active-spec highlight still work
