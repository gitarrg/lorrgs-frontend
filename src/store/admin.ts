import { RootState } from './store'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'


export interface AdminSliceState {
    selected_spec_rankings: { [key: string]: boolean }
}


////////////////////////////////////////////////////////////////////////////////
// Selectors
//

export function get_selected_specs_ranking(state: RootState, key: string): boolean {
    // undefined is considered true in this case
    return state.admin.selected_spec_rankings[key];
}


const INITIAL_STATE: AdminSliceState = {
    selected_spec_rankings: {},
}


const SLICE = createSlice({
    name: "admin",

    initialState: INITIAL_STATE,

    reducers: {

        set_selected_spec_ranking: (state, action: PayloadAction<{ key: string, selected: boolean }>) => {
            const { key, selected } = action.payload
            state.selected_spec_rankings[key] = selected
            return state
        }
    }, // reducers
}) // slice


export const {
    set_selected_spec_ranking,

} = SLICE.actions

export default SLICE.reducer
