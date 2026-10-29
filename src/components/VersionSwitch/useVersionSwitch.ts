import { useLocation, useNavigate } from "react-router-dom"
import { get_current_game_version, get_game_versions, switch_game_version } from "../../store/game_versions"
import { useAppDispatch, useAppSelector } from "../../store/store_hooks"
import type GameVersion from "../../types/game_version"

/** display names + order (the icon is picked by the same name, see WowLogo) */
const DISPLAY: { [name: string]: { title: string, order: number } } = {
    retail: { title: "Retail", order: 0 },
    forever: { title: "Forever", order: 1 },
    mists: { title: "Mists", order: 3 },
}

function with_display_names(versions: GameVersion[]): GameVersion[] {
    return versions
        .map(version => ({ ...version, title: DISPLAY[version.name]?.title ?? version.title }))
        .sort((a, b) => (DISPLAY[a.name]?.order ?? 99) - (DISPLAY[b.name]?.order ?? 99))
}

/** Versions to show + a switch function. On a spec ranking page we keep the spec and let the new version pick a boss. */
export function useVersionSwitch() {
    const all_versions = useAppSelector(get_game_versions)
    const current_version = useAppSelector(get_current_game_version)
    const spec_slug = useAppSelector(state => state.ui.spec_slug)

    const versions = with_display_names(all_versions)
    const current = versions.find(version => version.name == current_version?.name)

    const { pathname, search } = useLocation()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    // stay on the current page, only the game version changes
    let target = "/"
    if (pathname.startsWith("/spec_ranking/") && spec_slug) { target = `/spec_ranking/${spec_slug}/random` }  // same spec, any boss
    if (pathname.startsWith("/user_report/")) { target = `${pathname}${search}` }  // same report
    // home: "/"
    const switch_to = (version: GameVersion) => {
        dispatch(switch_game_version(version))
        navigate(target)
    }

    return { versions, current, switch_to }
}
