import { get_occuring_bosses, get_occuring_specs, load_report_fights } from "../../store/fights"
import { load_boss_spells } from '../../store/bosses'
import { get_current_game_version, get_game_versions, get_game_version_by_wcl_id, switch_game_version } from '../../store/game_versions'
import { get_user_report, load_report_overview } from '../../store/user_reports'
import { load_spec_spells } from '../../store/specs'
import { useAppDispatch, useAppSelector } from '../../store/store_hooks'
import { useEffect } from 'react'
import { useParams, useLocation } from 'react-router'
import { useTitle } from 'react-use'
import * as ui_store from "../../store/ui"
import CopyNoteWindow from "../../components/CopyNoteWindow"
import LoadingOverlay from "./../../components/shared/LoadingOverlay"
import PlayerNamesList from "./../../components/PlayerNames/PlayerNamesList"
import ReportHeader from './ReportHeader'
import ReportSettingsBar from './ReportSettingsBar'
import TimelineCanvas from "./../../components/Timeline/TimelineCanvas"
import { VersionTabsCentered } from "../../components/VersionSwitch/Variants"
import UserReportNavbar from './UserReportNavbar'


////////////////////////////////////////////////////////////////////////////////
// Component
//

export default function UserReport() {

    const mode = ui_store.MODES.USER_REPORT

    ////////////////////////////////////////////////////////////////////////////
    // Hooks
    const { report_id } = useParams<{report_id: string}>();
    const { search } = useLocation();

    const dispatch = useAppDispatch()
    const is_loading = useAppSelector(state => ui_store.get_is_loading(state))
    const specs = useAppSelector(get_occuring_specs)
    const bosses = useAppSelector(get_occuring_bosses)
    const user_report = useAppSelector(get_user_report)
    const game_versions = useAppSelector(get_game_versions)
    const current_game_version = useAppSelector(get_current_game_version)
    const report_game_version = useAppSelector(state => get_game_version_by_wcl_id(state, user_report.game_version))

    ////////////////////////////////////////////////////////////////////////////
    // Update State
    //
    useTitle(`Lorrgs: Report: ${report_id}`)


    useEffect(() => {
        dispatch(ui_store.set_mode(mode)) // in useEffect to only run once

        // initial display settings
        dispatch(ui_store.update_settings({
            show_deaths: true,
        }))
    }, [])


    // (also when the Game Version changes: that drops the loaded fights)
    useEffect(() => {
        dispatch(load_report_overview(report_id))
        dispatch(load_report_fights(report_id, search))
    }, [report_id, current_game_version?.name])


    // The report's Game Version comes from its log: show it with the data of that Game Version.
    // (once switched, the Game Versions match and nothing happens.)
    useEffect(() => {
        if (user_report.report_id != report_id) { return }  // overview not loaded (yet)
        report_game_version && dispatch(switch_game_version(report_game_version))
    }, [user_report.report_id, report_game_version])


    useEffect(() => {
        specs.forEach(spec_slug => {
            dispatch(load_spec_spells(spec_slug))
        })
    }, [specs])

    useEffect(() => {
        bosses.forEach(boss_slug => {
            // todo: check if loaded
            dispatch(load_boss_spells(boss_slug))
        })
    }, [bosses])


    ////////////////////////////////////////////////////////////////////////////
    // Render
    //
    return (
        <div className={mode}>

            <div className="mt-3 flex-row justify-content-space-between d-flex align-items-center" style={{ position: "relative" }}>
                <ReportHeader />
                <VersionTabsCentered />
                <UserReportNavbar />
            </div>

            <div className={`${is_loading ? "loading_trans" : ""} mt-2`}>
                <ReportSettingsBar />
            </div>
            {is_loading && <LoadingOverlay />}

            {/* the overview failed to load (eg.: private report, or a game version we dont serve) */}
            {user_report.error && <div className="text-danger mt-2">{user_report.error}</div>}

            {/* Warcraft Logs game version none of ours serves */}
            {user_report.report_id == report_id && user_report.game_version !== undefined && game_versions.length > 0 && !report_game_version &&
                <div className="text-danger mt-2">Unsupported Warcraft Logs game version: {user_report.game_version}</div>
            }
            { <CopyNoteWindow />}

            <div className={`p-2 bg-dark rounded border d-flex ${is_loading ? "loading_trans" : ""}`}>
                <PlayerNamesList />
                <TimelineCanvas />
            </div>
        </div>
    );
}
