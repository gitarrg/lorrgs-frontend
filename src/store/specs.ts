import type Spec from "../types/spec"
import type { RootState, AppDispatch } from './store'
import { ASSETS } from '../constants'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { fetch_versioned, get_game_version_name } from '../api'
import { group_spells_by_type } from './store_utils'


export interface SpecSliceState {
    specs_by_name: { [key: string]: Spec }
}


////////////////////////////////////////////////////////////////////////////////
// Actions
//

export function get_specs(state: RootState) {
    return state.specs.specs_by_name
}

export function get_spec(state: RootState, spec_slug?: string) {
    spec_slug = spec_slug?.split(":")[0] // allow a suffix (eg.: for placeholder purposes)
    spec_slug = spec_slug || state.ui.spec_slug // input or current spec
    return state.specs.specs_by_name[spec_slug] || null
}

/** Find the first spec that can use a given spell
 * @param {object} state current state
 * @param {number} spell_id id of the spell to find
 * @returns {object} the matched spell
*/
export function get_spec_for_spell_id(state: RootState, spell_id: number) {
    return Object.values(state.specs.specs_by_name).find(spec => {
        return Object.values(spec.spells_by_type || {}).some(spell_group => {
            return spell_group.includes(spell_id)
        }) // spell group
    }) // specs
}


////////////////////////////////////////////////////////////////////////////////
// Slice
//

function _process_spec(spec: Spec) {
    spec.loaded = false
    spec.icon_path = `${ASSETS}/images/specs/${spec.full_name_slug}.jpg`
    return spec
}


const INITIAL_STATE: SpecSliceState = {
    specs_by_name: {},
}


const SLICE = createSlice({
    name: "specs",

    initialState: INITIAL_STATE,

    reducers: {

        set_specs: (state, action: PayloadAction<Spec[]>) => {

            action.payload.forEach(spec => {
                state.specs_by_name[spec.full_name_slug] = _process_spec(spec)
            })
            return state
        },

        set_spec_spells: (state, action) => {
            const { spec_slug, spells } = action.payload
            const spec = state.specs_by_name[spec_slug]
            if (!spec) { return state }

            spec.spells_by_type = group_spells_by_type(spells, spec)
            spec.loaded = true
            return state
        },
    }, // reducers
}) // slice


export const {
    set_spec_spells
} = SLICE.actions

export default SLICE.reducer


////////////////////////////////////////////////////////////////////////////////
// Extra Actions


export function load_specs() {

    return async (dispatch: AppDispatch) => {
        dispatch({ type: "ui/set_loading", payload: { key: "specs", value: true } })
        try {

            // Request
            const specs_dict = await fetch_versioned("/specs");
            specs_dict && dispatch(SLICE.actions.set_specs(specs_dict.specs || []))
        } finally {
            dispatch({ type: "ui/set_loading", payload: { key: "specs", value: false } })
        }
    }
}


export function load_spec_spells(spec_slug: string) {

    return async (dispatch: AppDispatch, getState: () => RootState) => {
        const load_key = `specs/${get_game_version_name()}/${spec_slug}`
        if (getState().ui._loading[load_key]) { return } // already on its way
        dispatch({ type: "ui/set_loading", payload: { key: load_key, value: true } })
        try {

            // Request
            const spells = await fetch_versioned(`/specs/${spec_slug}/spells`);

            spells && dispatch(SLICE.actions.set_spec_spells({ spec_slug, spells }))
        } finally {
            dispatch({ type: "ui/set_loading", payload: { key: load_key, value: false } })
        }
    }
}
