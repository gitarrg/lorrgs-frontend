import type Actor from '../types/actor';
import type Fight from '../types/fight';
import type SpecRanking from "../types/spec_ranking";
import type CompRanking from "../types/spec_ranking";
import type { AppDispatch, RootState } from './store'
import { MODES } from './ui'
import { createSelector } from 'reselect'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { fetch_data } from '../api'


////////////////////////////////////////////////////////////////////////////////
// Selectors
//

export function get_all_fights(state: RootState): { [key: number]: Fight } {
    return state.fights.fights_by_id
}


export function get_fight_ids(state: RootState) {
    return state.fights.fight_ids
}


export function get_fight_is_loaded(state: RootState, fight_id: number) {
    return state.fights.fights_by_id[fight_id] != undefined;
}


export const get_fights = createSelector(
    get_all_fights,
    (fights_by_id) => {
        return Object.values(fights_by_id)
    }
)


/** Get all specs that occur in any of the fights */
export const get_occuring_specs = createSelector(
    get_fights,
    (fights) => {

        const specs_set = new Set<string>()

        fights.forEach(fight => {
            fight.players.forEach(player => {
                specs_set.add(player.spec_slug)
            });
        })
        return Array.from(specs_set) // Set to Array
    }
)


/** Get all specs that occur in any of the fights
 * returns a list of boss_slugs
 */
export const get_occuring_bosses = createSelector(
    get_fights,
    (fights) => {

        const boss_names = new Set<string>()

        fights.forEach(fight => {
            if (fight.boss?.boss_slug) {
                boss_names.add(fight.boss.boss_slug)
            }
        })
        return Array.from(boss_names)
    }
)


////////////////////////////////////////////////////////////////////////////////
// Slice
//
function _process_actor(actor: Actor) {

    const spell_counter: { [key: number]: number } = {}
    actor.casts = actor.casts || []
    actor.casts.forEach(cast => {
        cast.counter = spell_counter[cast.id] = (spell_counter[cast.id] || 0) + 1
    })
    return actor
}


function is_empty_fight(fight: Fight) {

    if (fight.boss?.casts?.length) {
        return false
    }

    if (fight.players.some(player => player.casts.length > 0)) {
        return false
    }
    // sorry bro
    return true
}


function _process_fight(fight: Fight) {
    if (fight.boss) {
        fight.boss = _process_actor(fight.boss)
        fight.boss.class_slug = "boss"
        fight.boss.spec_slug = fight.boss.name
    }
    fight.players.forEach(actor => _process_actor(actor))
    return fight
}



function _process_fights(fights: Fight[]) {
    fights = fights.map(fight => _process_fight(fight))
    fights = fights.filter(fight => !is_empty_fight(fight))
    return fights
}


const SLICE = createSlice({
    name: "fights",

    initialState: {
        fights_by_id: {} as { [key: string]: Fight },
        fight_ids: [] as string[],
    },

    reducers: {
        set_fights: (state, action: PayloadAction<Fight[]>) => {

            const fights = _process_fights(action.payload ?? [])

            state.fights_by_id = {}
            state.fight_ids = []
            fights.forEach(fight => {
                // include the player ID, in case there are multiple top100 parses
                // of the same spec in a single fight
                const player_id = fight.players[0]?.source_id || 0
                const fight_key = `${fight.report_id}/${fight.fight_id}/${player_id}`
                state.fights_by_id[fight_key] = fight
                state.fight_ids.push(fight_key)
            })
            return state
        },
    }, // reducers

}) // slice


export const { set_fights } = SLICE.actions
export default SLICE.reducer


////////////////////////////////////////////////////////////////////////////////
// Extra Actions

function _pin_first_fight(fights: Fight[]) {
    // little hack to make sure the first fight always remains visible
    if (fights.length == 0) { return fights }

    const [first_fight, ...others] = fights
    first_fight.pinned = true
    if (first_fight.boss) {
        first_fight.boss.pinned = true
    }

    return [first_fight, ...others]
}


async function _load_spec_rankings(
    spec_slug: string,
    boss_slug: string,
    difficulty: string,
    metric: string = ""
): Promise<Fight[]> {

    const query = new URLSearchParams({
        difficulty: difficulty,
        metric: metric,
    })

    const url = `/api/spec_ranking/${spec_slug}/${boss_slug}?${query.toString()}`;
    const spec_ranking: SpecRanking = await fetch_data(url);

    // unpack the fights
    let fights: Fight[] = []
    spec_ranking.reports?.forEach((report, i) => {
        report.fights?.forEach(fight => {
            fight.report_id = report.report_id
            fight.region = report.region
            fights.push(fight)
            // insert ranking data
            fight.players.forEach(player => {
                player.rank = i + 1
            })

            if (i > 0) {
                fight.boss = undefined
            }
        })
    })
    fights = _pin_first_fight(fights)
    return fights
}


async function _load_comp_rankings(
    boss_slug: string,
    search = ""
): Promise<Fight[]> {
    const url = `/api/comp_ranking/${boss_slug}${search}`;
    const comp_rankings: CompRanking = await fetch_data(url);

    // unpack the fights
    let fights: Fight[] = []
    comp_rankings.reports?.forEach((report, i) => {
        report.fights?.forEach(fight => {
            fight.report_id = report.report_id
            fights.push(fight)
        })
    })
    return fights
}


export function load_fights(
    mode: string,
    { boss_slug, spec_slug = "", difficulty = "mythic", metric = "dps", search = "" }: { boss_slug: string, spec_slug?: string, difficulty?: string, metric?: string, search?: string }
) {

    return async (dispatch: AppDispatch) => {

        dispatch({ type: "ui/set_loading", payload: { key: "fights", value: true } })

        // load
        let fights: Fight[] = []
        switch (mode) {
            case MODES.SPEC_RANKING:
                fights = await _load_spec_rankings(spec_slug, boss_slug, difficulty, metric)
                break;
            case MODES.COMP_RANKING:
                fights = await _load_comp_rankings(boss_slug, search)
                break;
            default:
                break;
        } // switch

        // set
        dispatch(set_fights(fights))
        dispatch({ type: "ui/set_loading", payload: { key: "fights", value: false } })
    } // async dispatch
}


export function load_report_fights(report_id: string, search: string = "") {

    return async (dispatch: AppDispatch) => {
        dispatch({ type: "ui/set_loading", payload: { key: "fights", value: true } })

        const url = `/api/user_reports/${report_id}/fights`;
        const report_data = await fetch_data(url, search)

        // insert report id (for urls)
        report_data.fights?.forEach(fight => {
            fight.report_id = report_id
        })

        dispatch(set_fights(report_data.fights))
        dispatch({ type: "ui/set_loading", payload: { key: "fights", value: false } })
    }
}
