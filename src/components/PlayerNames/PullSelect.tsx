import { Menu, MenuButton, MenuDivider, MenuItem } from "@szhsin/react-menu"
import { get_pull_label } from "../Timeline/PullMarker"
import { get_pull_selection, get_run_key, set_pull_selection, toggle_pull } from "../../store/ui"
import { toMMSS } from "../../utils"
import { useAppDispatch, useAppSelector } from "../../store/store_hooks"
import styles from "./PullSelect.module.scss"
import type Fight from "../../types/fight"


/**
 * Names column cell next to the `PullRow` of a dungeon run:
 * picks the pulls to show (none selected: the whole run).
 */
export default function PullSelect({ fight }: { fight: Fight }) {

    const dispatch = useAppDispatch()
    const selected = useAppSelector(state => get_pull_selection(state, fight))

    const pulls = fight.pulls || []
    if (pulls.length == 0) { return null }
    const run_key = get_run_key(fight)

    let label = `All pulls (${pulls.length})`
    if (selected.length == 1) { label = get_pull_label(pulls[selected[0]], selected[0]) }
    if (selected.length > 1) { label = `${selected.length} of ${pulls.length} pulls` }

    return (
        <div className={styles.pull_select}>
            <Menu
                menuButton={<MenuButton className={styles.button}>{label}<span className={styles.caret}>▾</span></MenuButton>}
                menuClassName={styles.menu}
                overflow="auto"
                setDownOverflow
                boundingBoxPadding="8"
                portal
            >
                <MenuItem
                    disabled={selected.length == 0}
                    onClick={() => dispatch(set_pull_selection({ run_key, indices: [] }))}
                >
                    Whole run
                </MenuItem>
                <MenuDivider />

                {pulls.map((pull, i) => (
                    <MenuItem
                        key={i}
                        type="checkbox"
                        checked={selected.includes(i)}
                        onClick={event => {
                            event.keepOpen = true
                            dispatch(toggle_pull({ run_key, index: i }))
                        }}
                    >
                        <span className={styles.check}>{selected.includes(i) ? "✔" : ""}</span>
                        <span className={pull.boss ? styles.boss : ""}>{get_pull_label(pull, i)}</span>
                        <small className={styles.time}>{toMMSS(pull.start / 1000)} - {toMMSS(pull.end / 1000)}</small>
                    </MenuItem>
                ))}
            </Menu>
        </div>
    )
}
