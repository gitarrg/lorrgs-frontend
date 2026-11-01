import type TalentTree from '../types/talent_tree'
import type { AppDispatch, RootState } from './store'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { fetch_versioned, get_game_version_name } from '../api'


export interface TalentTreesSliceState {
    /** `null`: the spec has no tree (eg.: unknown spec) */
    trees_by_spec: { [spec_slug: string]: TalentTree | null }
}


////////////////////////////////////////////////////////////////////////////////
// Selectors
//

/** The talent tree of a spec. `undefined` while not loaded, `null` if there is none. */
export function get_talent_tree(state: RootState, spec_slug: string): TalentTree | null | undefined {
    return state.talent_trees.trees_by_spec[spec_slug]
}


////////////////////////////////////////////////////////////////////////////////
// Slice
//

const INITIAL_STATE: TalentTreesSliceState = {
    trees_by_spec: {},
}


const SLICE = createSlice({
    name: "talent_trees",

    initialState: INITIAL_STATE,

    reducers: {
        set_talent_tree: (state, action: PayloadAction<{ spec_slug: string, tree: TalentTree | null }>) => {
            state.trees_by_spec[action.payload.spec_slug] = action.payload.tree
            return state
        },
    },
})

export default SLICE.reducer


////////////////////////////////////////////////////////////////////////////////
// Extra Actions
//

export function load_talent_tree(spec_slug: string) {

    return async (dispatch: AppDispatch, getState: () => RootState) => {
        if (getState().talent_trees.trees_by_spec[spec_slug] !== undefined) { return } // already loaded
        const load_key = `talent_trees/${get_game_version_name()}/${spec_slug}`
        if (getState().ui._loading[load_key]) { return } // already on its way
        dispatch({ type: "ui/set_loading", payload: { key: load_key, value: true } })
        try {
            const tree = await fetch_versioned(`/talent_trees/${spec_slug}`)
            if (!tree) { return } // Game Version changed in the meantime
            dispatch(SLICE.actions.set_talent_tree({ spec_slug, tree: tree.error ? null : tree }))
        } finally {
            dispatch({ type: "ui/set_loading", payload: { key: load_key, value: false } })
        }
    }
}
