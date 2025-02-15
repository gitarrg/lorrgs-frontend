/*
Redux Data Store
*/

import { configureStore } from '@reduxjs/toolkit'

import { DEBUG } from '../constants'
import bosses_reducer from "./bosses"
import classes_reducer from "./classes"
import fights_reducer from "./fights"
import roles_reducer from "./roles"
import seasons_reducer from "./seasons"
import specs_reducer from "./specs"
import spells_reducer from "./spells"
import status_reducer from "./status"
import ui_reducer from "./ui"
import user_reducer from "./user"
import user_report_reducer from "./user_reports"


////////////////////////////////////////////////////////////////////////////////
// REDCUER
//
const store = configureStore({

    // preloadedState: DEFAULT_STATE,
    reducer: {
        classes: classes_reducer,
        fights: fights_reducer,
        roles: roles_reducer,
        seasons: seasons_reducer,
        specs: specs_reducer,
        spells: spells_reducer,
        status: status_reducer,
        ui: ui_reducer,
        user_report: user_report_reducer,
        user: user_reducer,
        zones: bosses_reducer,
    },
    devTools: DEBUG,
})

export default store


// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
