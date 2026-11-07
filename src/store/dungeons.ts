import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type Dungeon from "../types/dungeon"
import type { AppDispatch, RootState } from './store'
import { fetch_versioned } from '../api'
import { ASSETS } from '../constants'


////////////////////////////////////////////////////////////////////////////////
// Selectors
//

/** a single dungeon by its slug (`Fight.dungeon`), or `null` if unknown */
export function get_dungeon(state: RootState, dungeon_slug?: string): Dungeon | null {
    if (!dungeon_slug) { return null }
    return state.dungeons[dungeon_slug] || null
}


////////////////////////////////////////////////////////////////////////////////
// Slice
//

type DungeonAPIResponse = Omit<Dungeon, "icon_path">

const INITIAL_STATE = {} as { [key: string]: Dungeon }

const SLICE = createSlice({
    name: "dungeons",

    initialState: INITIAL_STATE,

    reducers: {
        set_dungeons: (state, action: PayloadAction<DungeonAPIResponse[]>) => {
            action.payload.forEach(dungeon => {
                state[dungeon.name_slug] = {
                    ...dungeon,
                    icon_path: `${ASSETS}/images/spells/${dungeon.icon}`,
                }
            })
            return state
        },
    },
})

export default SLICE.reducer


////////////////////////////////////////////////////////////////////////////////
// Extra Actions

/** load all dungeons of the current Game Version (only the ones whose runs can be loaded) */
export function load_dungeons() {

    return async (dispatch: AppDispatch) => {

        dispatch({ type: "ui/set_loading", payload: { key: "dungeons", value: true } })
        try {
            const response: { dungeons: DungeonAPIResponse[] } | null = await fetch_versioned("/dungeons")
            response && dispatch(SLICE.actions.set_dungeons(response.dungeons))
        } finally {
            dispatch({ type: "ui/set_loading", payload: { key: "dungeons", value: false } })
        }
    }
}
