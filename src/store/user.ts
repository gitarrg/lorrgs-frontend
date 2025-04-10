/** Slice to hold and request data about the currently logged in user. */
import { jwtDecode } from "jwt-decode";
import type { RootState, AppDispatch } from './store'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { fetch_data } from '../api'


/** name of the local storage key we use to store the logged in user */
const LOCAL_STORAGE_KEY = "user_token"


/** Get the currently logged in user */
export function get_current_user(state: RootState) {
    return state.user
}


interface UserSliceState {

    logged_in: boolean
    name: string
    id: string
    permissions: string[]
    avatar?: string
    error?: string
    error_message?: string
}


const INITIAL_STATE: UserSliceState = {
    logged_in: false,
    name: "",
    id: "",
    permissions: []
}


const SLICE = createSlice({
    name: "user",

    initialState: INITIAL_STATE,

    reducers: {

        /** Store a newly received token */
        token_received: (state, action: PayloadAction<string>) => {
            localStorage.setItem(LOCAL_STORAGE_KEY, action.payload)
            return state
        },

        /** Read the User Data from a token */
        token_loaded: (state, action: PayloadAction<string>) => {
            const user_info: {} = jwtDecode(action.payload)
            return {
                ...state,
                ...user_info,
                logged_in: true,
            }
        },

        /** Store Error Inforation from a failed token request */
        token_failed: (state, action: PayloadAction<{ error: "", message: "" }>) => {
            return {
                ...INITIAL_STATE,
                error: action.payload.error,
                error_message: action.payload.message,
            }
        },

        /** Log the user out of Lorrgs */
        logout: () => {
            localStorage.removeItem(LOCAL_STORAGE_KEY)
            return INITIAL_STATE
        },

        user_loaded: (state, action: PayloadAction<UserSliceState>) => {
            return {
                ...state,
                ...action.payload,
                logged_in: true,
            }
        },

    }, // reducers
})

export const {
    logout
} = SLICE.actions


export default SLICE.reducer


/** log the user into Lorrgs via a auth-code received from a third party Auth Provider */
export function login(code: string) {

    return async (dispatch: AppDispatch) => {

        // Request
        const response = await fetch_data("/api/auth/token", { code });

        const token = response.token
        if (token) {
            dispatch(SLICE.actions.token_received(token))
            dispatch(SLICE.actions.token_loaded(token))
            dispatch(load_user(true))
        } else {
            dispatch(SLICE.actions.token_failed(response))
        }
    }
}


/** load info for the logged in user  */
export function load_user(refresh: boolean = false) {

    return async (dispatch: AppDispatch) => {

        const token = localStorage.getItem(LOCAL_STORAGE_KEY) || ""
        if (!token) { return }

        let user_info: UserSliceState = jwtDecode(token)

        // load additional info
        let url = `/api/auth/users/${user_info.id}`
        if (refresh) {
            url = `${url}/refresh`
        }
        const response = await fetch_data(url);

        if (response) {
            dispatch(SLICE.actions.user_loaded(response))
        }
    }
}
