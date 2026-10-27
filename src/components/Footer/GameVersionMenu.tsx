import { get_current_game_version, get_selectable_game_versions, switch_game_version } from "../../store/game_versions"
import { useAppSelector } from "../../store/store_hooks"
import styles from "./Footer.module.scss"


/* Small menu to switch between the Game Versions (hidden if there is nothing to switch to). */
export default function GameVersionMenu() {

    const game_versions = useAppSelector(get_selectable_game_versions)
    const current = useAppSelector(get_current_game_version)
    if (!current || game_versions.length < 2) { return null }

    const on_change = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const game_version = game_versions.find(version => version.name == event.target.value)
        game_version && switch_game_version(game_version)
    }

    return (
        <select className={`${styles.game_version_menu} bg-dark text-muted border rounded`} value={current.name} onChange={on_change} title="Game Version">
            {game_versions.map(version => <option key={version.name} value={version.name}>{version.title}</option>)}
        </select>
    )
}
