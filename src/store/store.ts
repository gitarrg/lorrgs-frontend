/*
Redux Data Store
*/

import { combineReducers, configureStore, UnknownAction } from '@reduxjs/toolkit'

import { DEBUG } from '../constants'
import bosses_reducer from "./bosses"
import classes_reducer from "./classes"
import dungeons_reducer from "./dungeons"
import fights_reducer from "./fights"
import game_versions_reducer, { SWITCH_GAME_VERSION } from "./game_versions"
import report_links_reducer from "./report_links"
import roles_reducer from "./roles"
import seasons_reducer from "./seasons"
import specs_reducer from "./specs"
import spells_reducer from "./spells"
import talent_trees_reducer from "./talent_trees"
import ui_reducer from "./ui"
import user_reducer from "./user"
import user_report_reducer from "./user_reports"

////////////////////////////////////////////////////////////////////////////////
// REDCUER
//
const combined_reducer = combineReducers({
    classes: classes_reducer,
    dungeons: dungeons_reducer,
    fights: fights_reducer,
    game_versions: game_versions_reducer,
    report_links: report_links_reducer,
    roles: roles_reducer,
    seasons: seasons_reducer,
    specs: specs_reducer,
    spells: spells_reducer,
    talent_trees: talent_trees_reducer,
    ui: ui_reducer,
    user_report: user_report_reducer,
    user: user_reducer,
    zones: bosses_reducer,
})


/** Switching the Game Version drops everything that is specific to one: only these slices stay. */
function root_reducer(state: ReturnType<typeof combined_reducer> | undefined, action: UnknownAction) {
    if (state && action.type == SWITCH_GAME_VERSION) {
        const { game_versions, report_links, ui, user, user_report } = state
        state = { game_versions, report_links, ui, user, user_report } as typeof state  // the rest starts from its initial state
    }
    return combined_reducer(state, action)
}


const store = configureStore({
    reducer: root_reducer,
    devTools: DEBUG,
})

export default store


// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
