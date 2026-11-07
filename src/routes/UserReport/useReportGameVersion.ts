import { useEffect } from 'react'
import { load_bosses } from '../../store/bosses'
import { get_current_game_version, get_game_version_by_wcl_id, switch_game_version } from '../../store/game_versions'
import { get_user_report } from '../../store/user_reports'
import { useAppDispatch, useAppSelector } from '../../store/store_hooks'


/**
 * Show the loaded User Report with the data of its own Game Version (it comes from its log).
 *
 * Switches to that Game Version (which drops all Game Version specific data, see `store.ts`),
 * then loads the report's zone with it. Returns true once the Game Versions match.
 *
 * @param report_id only for this report (skips the overview of a previous one, still in the store)
 */
export default function useReportGameVersion(report_id?: string): boolean {

    const dispatch = useAppDispatch()
    const user_report = useAppSelector(get_user_report)
    const current_game_version = useAppSelector(get_current_game_version)
    const is_loaded = !!user_report.report_id && (!report_id || user_report.report_id == report_id)
    const report_game_version = useAppSelector(state => is_loaded ? get_game_version_by_wcl_id(state, user_report.game_version) : undefined)

    const is_matching = !!report_game_version && report_game_version.name == current_game_version?.name

    // (once switched, the Game Versions match and nothing happens.)
    useEffect(() => {
        report_game_version && dispatch(switch_game_version(report_game_version))
    }, [user_report.report_id, report_game_version])

    // the report's zone, with the data of the report's Game Version (a dungeon-only report has none)
    useEffect(() => {
        if (!is_matching || !(user_report.zone_id > 0)) { return }
        dispatch(load_bosses(user_report.zone_id))
    }, [is_matching, user_report.report_id, user_report.zone_id])

    return is_matching
}
