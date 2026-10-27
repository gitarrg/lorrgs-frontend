import { useLocation } from "react-router-dom"
import { get_current_game_version, get_selectable_game_versions, switch_game_version } from "../../store/game_versions"
import { useAppSelector } from "../../store/store_hooks"
import type GameVersion from "../../types/game_version"

// shown when the backend lists only one version, so the prototypes are visible during development
const MOCK_VERSIONS: GameVersion[] = [
    { name: "retail", title: "Retail", api_url: "", active: true },
    { name: "forever", title: "Forever", api_url: "", active: false },
    { name: "classic", title: "Classic Era", api_url: "", active: false },
    { name: "classic_mop", title: "Mists", api_url: "", active: false },
]

/** display names + order (the icon is picked by the same name, see WowLogo) */
const DISPLAY: { [name: string]: { title: string, order: number } } = {
    retail: { title: "Retail", order: 0 },
    forever: { title: "Forever", order: 1 },
    classic: { title: "Classic Era", order: 2 },
    classic_mop: { title: "Mists", order: 3 },
}

function with_display_names(versions: GameVersion[]): GameVersion[] {
    return versions
        .map(version => ({ ...version, title: DISPLAY[version.name]?.title ?? version.title }))
        .sort((a, b) => (DISPLAY[a.name]?.order ?? 99) - (DISPLAY[b.name]?.order ?? 99))
}

/** Versions to show + a switch function. On a spec ranking page we keep the spec and let the new version pick a boss. */
export function useVersionSwitch() {
    const real = useAppSelector(get_selectable_game_versions)
    const real_current = useAppSelector(get_current_game_version)
    const spec_slug = useAppSelector(state => state.ui.spec_slug)

    const versions = with_display_names(real.length > 1 ? real : MOCK_VERSIONS)
    const current = versions.find(version => version.name == real_current?.name && real.length > 1) ?? versions[0]

    const { pathname, search } = useLocation()

    // stay on the current page, only the game version changes
    let target = "/"
    if (pathname.startsWith("/spec_ranking/") && spec_slug) { target = `/spec_ranking/${spec_slug}/random` }  // same spec, any boss
    if (pathname.startsWith("/user_report/")) { target = `${pathname}${search}` }  // same report
    // home: "/"
    const switch_to = (version: GameVersion) => switch_game_version(version, target)

    return { versions, current, switch_to }
}
