import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTitle } from 'react-use'

/* local imports */
import { AUTO_DIFFICULTY, DEFAULT_DIFFICULTY } from '../constants'
import { get_boss, get_zones, load_boss_spells } from '../store/bosses'
import { get_spec, load_spec_spells } from '../store/specs'
import { load_fights } from "../store/fights"
import { useAppDispatch, useAppSelector } from '../store/store_hooks'
import * as ui_store from "../store/ui"
import CopyNoteWindow from "../components/CopyNoteWindow"
import LoadingOverlay from "./../components/shared/LoadingOverlay"
import Navbar from "./../components/Navbar/Navbar"
import PlayerNamesList from "./../components/PlayerNames/PlayerNamesList"
import SpecRankingsHeader from './SpecRankings/SpecRankingsHeader'
import SpecSettingsBar from './SpecRankings/SpecSettingsBar'
import { VersionTabsHidden } from '../components/VersionSwitch/Variants'
import TimelineCanvas from "./../components/Timeline/TimelineCanvas"
import type Spec from '../types/spec'
import useQuery from "../hooks/useQuery"

////////////////////////////////////////////////////////////////////////////////
// Component
//

function spec_metric(spec: Spec) {
    return spec && spec.role == "heal" ? "hps" : "dps"
}


export default function SpecRankings() {

    ////////////////////////////////////////////////////////////////////////////
    // Hooks
    let { spec_slug, boss_slug } = useParams<{ spec_slug: string, boss_slug: string }>();
    const query = useQuery()
    const navigate = useNavigate()
    const zones = useAppSelector(state => get_zones(state))
    const dispatch = useAppDispatch()
    const is_loading = useAppSelector(state => ui_store.get_is_loading(state))
    const boss = useAppSelector(state => get_boss(state, boss_slug))
    const spec = useAppSelector(state => get_spec(state, spec_slug))
    // if (!boss_slug || !spec_slug) { return null }
    // if (!spec || !boss) { return null }

    // zones with a single ranked difficulty ignore the url param and use `auto`
    const difficulty = boss?.difficulty ? AUTO_DIFFICULTY : (query.get("difficulty") || DEFAULT_DIFFICULTY)
    const metric = query.get("metric") || spec_metric(spec)

    // const
    const mode = ui_store.MODES.SPEC_RANKING

    ////////////////////////////////////////////////////////////////////////////
    // Update State
    //
    useTitle(`Lorrgs: ${spec?.full_name || "..."} vs. ${boss?.full_name || "..."}`)

    // `random` (after switching game version): keep the spec, pick any boss of the new version
    useEffect(() => {
        if (boss_slug != "random") { return }
        const boss_names = zones.flatMap(zone => zone.bosses)
        if (!boss_names.length) { return }  // not loaded yet
        const pick = boss_names[Math.floor(Math.random() * boss_names.length)]
        navigate(`/spec_ranking/${spec_slug}/${pick}`, { replace: true })
    }, [boss_slug, zones])

    // set UI values
    useEffect(() => { dispatch(ui_store.set_mode(mode)) }, [])
    useEffect(() => { dispatch(ui_store.set_boss_slug(boss_slug)) }, [boss_slug])
    useEffect(() => { dispatch(ui_store.set_spec_slug(spec_slug)) }, [spec_slug])
    useEffect(() => { dispatch(ui_store.set_difficulty(difficulty)) }, [difficulty])
    useEffect(() => { dispatch(ui_store.set_metric(metric)) }, [spec, metric])

    useEffect(() => {
        if (!spec) { return }
        if (spec.loaded) { return } // skip if we already have them
        dispatch(load_spec_spells(spec.full_name_slug))
    }, [spec])

    useEffect(() => {
        if (!boss) { return }
        if (boss.loaded) { return } // skip if we already have them
        dispatch(load_boss_spells(boss.full_name_slug))
    }, [boss])

    // load fights
    useEffect(() => {
        if (!spec?.spells_by_type) { return }
        if (!boss?.spells_by_type) { return }
        if (!metric) { return }
        dispatch(load_fights(mode, { spec_slug, boss_slug, difficulty, metric }))
    }, [spec, boss, difficulty, metric])


    ////////////////////////////////////////////////////////////////////////////
    // Render
    //
    return (
        <div className={mode}>
            <VersionTabsHidden />

            <div className="mt-3 flex-row d-flex flex-wrap-reverse">
                <SpecRankingsHeader spec_slug={spec_slug} boss_slug={boss_slug} />
                <Navbar />
            </div>

            <div className={`${is_loading ? "loading_trans" : ""}`}>
                <SpecSettingsBar />
            </div>
            {is_loading && <LoadingOverlay />}
            {<CopyNoteWindow />}

            <div className={`p-2 bg-dark rounded border d-flex ${is_loading ? "loading_trans" : ""}`}>
                <PlayerNamesList />
                <TimelineCanvas />
            </div>

            {/* <StickyFooterAd /> */}
        </div>
    );
}
