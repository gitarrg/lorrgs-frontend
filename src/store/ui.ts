import { createSelector } from 'reselect'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import Actor from '../types/actor'
import type { RootState } from './store'
import type Fight from '../types/fight'


// modes to switch some page related features
export const MODES = {
    NONE: "none",
    SPEC_RANKING: "spec_ranking",
    COMP_RANKING: "comp_ranking",
    USER_REPORT: "user_report",
}

export type Mode = "none" | "spec_ranking" | "comp_ranking"

///////////////////////////////////////////////////////////////////////////////
// Actions
//
export function get_mode(state: RootState) {
    return state.ui.mode
}


export function get_difficulty(state: RootState) {
    return state.ui.difficulty || "mythic"
}


export function get_metric(state: RootState) {
    return state.ui.metric || "dps"
}

export function get_filters(state: RootState) {
    return state.ui.filters
}


export const get_is_loading = createSelector(
    (state: RootState) => state.ui._loading, // dependency
    (loading_state) => {
        return Object.values(loading_state).some(v => v == true)
    }
)


export function get_tooltip(state: RootState) {
    return state.ui.tooltip
}


export function get_show_copynote(state: RootState): boolean {
    return state.ui.show_copynote
}

export function get_copynote_player(state: RootState): Actor | null {
    return state.ui.copynote_player
}

export function get_copynote_fight(state: RootState): Fight | null {
    return state.ui.copynote_fight
}


////////////////////////////////////////////////////////////////////////////////
// Slice
//
type FilterGroup =
    | "role"
    | "spec"
    | "class"


export interface FilterValues {

    killtime: { min: number | null, max: number | null }

    /** Filter Groups like:
     * role: { tank: false, heal: true}
     * spec: { holy-paladin: true}
     */
    role: { [key: string]: boolean }
    spec: { [key: string]: boolean }
    class: { [key: string]: boolean }

    /** Filter by Region */
    region: { [key: string]: boolean }

    // Hide Player Rows if all spells are hiden.
    hide_empty_rows: boolean

}

export type MetricOptions = "dps" | "hps" | "bossdps" | undefined


export interface UiSliceState {

    mode: "none" | "spec_ranking" | "comp_ranking"

    /** elements that are loading */
    _loading: { [key: string]: boolean }

    /** currently selected spec */
    spec_slug: string

    /** currently selected boss */
    boss_slug: string

    zone_id: number,

    /** selected difficulty */
    difficulty: string

    metric?: MetricOptions

    // Timeline Options
    settings: { [key: string]: boolean }

    // fight/player filter settings
    filters: FilterValues

    tooltip: {
        content: string
        position: { x: number, y: number }
    }

    // CopyNote Options
    show_copynote: boolean
    copynote_player: Actor | null
    copynote_fight: Fight | null
}


const INITIAL_STATE: UiSliceState = {

    mode: "none",

    _loading: {}, // elements that are loading

    spec_slug: "", // currently selected spec
    boss_slug: "", // currently selected boss
    zone_id: 0,
    difficulty: "mythic", // currently selected difficulty

    // Timeline Options
    settings: {
        show_casticon: true,
        show_casttime: true,
        show_duration: true,
        show_cooldown: true,
        show_deaths: false,
        show_phases: true,
    },

    // fight/player filter settings
    filters: {

        // player filters
        role: {},
        class: {},
        spec: {},

        // fight filters
        killtime: { min: null, max: null },

        hide_empty_rows: false,
        spells: {},
    },

    tooltip: {
        content: "",
        position: { x: 0, y: 0 }
    },

    show_copynote: false,
    copynote_player: null,
}


const SLICE = createSlice({
    name: "ui",

    initialState: INITIAL_STATE,

    reducers: {

        set_boss_slug: (state, action: PayloadAction<string>) => {
            state.boss_slug = action.payload
            return state
        },

        set_spec_slug: (state, action: PayloadAction<string>) => {
            state.spec_slug = action.payload
            return state
        },

        set_difficulty: (state, action: PayloadAction<string>) => {
            state.difficulty = action.payload
            return state
        },

        set_metric: (state, action: PayloadAction<string>) => {
            state.metric = action.payload as MetricOptions
            return state
        },

        update_settings: (state, action) => {
            state.settings = { ...state.settings, ...action.payload }
            return state
        },

        // Filters
        set_filter: (state, action: PayloadAction<{ group: FilterGroup, name: string, value: boolean }>) => {
            const { group, name, value } = action.payload
            state.filters[group] = state.filters[group] || {}
            state.filters[group][name] = value
            return state
        },

        set_filters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload }
            return state
        },

        set_region_filter: (state, action: PayloadAction<{ region: string, value: boolean }>) => {
            const { region, value } = action.payload
            state.filters.region = state.filters.region || {}
            state.filters.region[region] = value
            return state
        },

        // loading
        set_loading: (state, action: PayloadAction<{ key: string, value: boolean }>) => {
            state._loading[action.payload.key] = action.payload.value
            return state
        },

        set_mode: (state, action) => {
            state.mode = action.payload
            return state
        },

        set_tooltip: (state, action) => {
            const { content, position } = action.payload
            state.tooltip.content = content
            state.tooltip.position = position
            return state
        },

        set_show_copynote: (state, action: PayloadAction<boolean>) => {
            state.show_copynote = action.payload
            return state
        },

        set_copynote_player: (state, action: PayloadAction<Actor>) => {
            state.copynote_player = action.payload
            return state
        },

        set_copynote_fight: (state, action: PayloadAction<Fight>) => {
            state.copynote_fight = action.payload
            return state
        },


    }, // reducers
}) // slice


export const {
    set_boss_slug,
    set_difficulty,
    set_filter,
    set_filters,
    set_region_filter,
    set_metric,
    set_mode,
    set_spec_slug,
    set_tooltip,
    update_settings,
    set_show_copynote,
    set_copynote_player,
    set_copynote_fight,
} = SLICE.actions


export default SLICE.reducer
