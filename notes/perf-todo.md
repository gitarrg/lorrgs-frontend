# Perf TODO

## `set_fights` reducer (`src/store/fights.ts`)

The reducer assigns large plain fight objects (every player and cast) into the Immer draft, so Immer walks and deep-freezes all of them on every load. Probably slow for big spec rankings.

Ideas:
- Build `fights_by_id` and `fight_ids` outside the reducer (in the thunk) and replace the state wholesale.
- Skip auto-freeze for this data.

Profile first before changing anything.
