# 08: Player-names list renders only what changed

**What to build:** the 50 player name rows don't re-render unless their own fight or player changed. Remove the unused spell-display subscription in the player name component, and memoize the name and fight components.

**Blocked by:** 01 (done: fights load once, so fight objects stay stable)

**Status:** done

- [x] Toggling spells or display settings doesn't re-render the player names (check in the profiler)
- [x] Filters still hide and show rows correctly

## Done (2026-10-30)

- The fight row component is memoized, so a spell toggle no longer re-renders the 50 fight rows and their names. Before: about 350 component renders per toggle. After: 6.
- The spell-display subscription in the player name was **not** unused, as this ticket assumed. With "hide empty rows" on, it is what hides a name once all of that player's spells are hidden; the visibility check reads spell display from the store directly. Player and boss names now subscribe to their own visibility as a boolean, so they re-render only when they're shown or hidden.
- Checked against the previous commit: the region filter hides and shows the same names. In a two-player fight with "hide empty rows" on, hiding one player's spells hides only that name, and showing them again brings it back.
