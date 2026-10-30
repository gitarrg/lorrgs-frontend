# 06: Keep Navbar and settings bar out of load-cascade renders

**What to build:** commits caused by loading flags, spell loads or fights arriving no longer re-render the Navbar or the settings bar unless something they show actually changed.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] In a profile of a fresh page load, Navbar and settings bar are absent from commits that don't affect them
