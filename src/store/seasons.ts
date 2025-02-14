/*
    Store to manage seasonal information
*/
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type Season from '../types/season'
import { AppDispatch, RootState } from './store'
import { fetch_data } from '../api'



type SeasonsSlice = {
    current_season: string
    seasons: { [key: string]: Season }
}


////////////////////////////////////////////////////////////////////////////////
// Selectors
//


export function get_season(state: RootState, season_slug?: string): Season {
    season_slug = season_slug || state.seasons.current_season
    return state.seasons.seasons[season_slug]
}


export function get_current_season(state: RootState): Season {
    return state.seasons.seasons[state.seasons.current_season]
}



////////////////////////////////////////////////////////////////////////////////
// Slice
//


const INITIAL_STATE: SeasonsSlice = {
    current_season: "",
    seasons: {}
}


const SLICE = createSlice({
    name: "roles",

    initialState: INITIAL_STATE,

    reducers: {
        set_season: (state, action: PayloadAction<Season>) => {

            state.current_season = action.payload.slug
            state.seasons[action.payload.slug] = action.payload
            return state
        },
    },
})

export default SLICE.reducer


////////////////////////////////////////////////////////////////////////////////
// Extra Actions


export function load_season(season_slug?: string) {

    season_slug = season_slug || "current"

    return async (dispatch: AppDispatch) => {

        dispatch({ type: "ui/set_loading", payload: { key: "season", value: true } })

        // Request
        const season_info = await fetch_data(`/api/seasons/${season_slug}`);

        dispatch(SLICE.actions.set_season(season_info))
        dispatch({ type: "ui/set_loading", payload: { key: "season", value: false } })
    }
}