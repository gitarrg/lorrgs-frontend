import { useEffect, useRef, useState, type MouseEvent } from "react"
import { FaCaretDown } from "react-icons/fa"
import styles from "./PullSelect.module.scss"
import { get_pull_label, get_pull_time_info } from "../../pulls"
import { get_pull_selection, get_run_key, set_pull_selection } from "../../store/ui"
import { get_view_settings, set_view_setting } from "../../store/report_links"
import { toMMSS } from "../../utils"
import { useAppDispatch, useAppSelector } from "../../store/store_hooks"
import DungeonRunInfo, { DungeonRunTitle, get_run_time } from "./DungeonRunInfo"
import type Dungeon from "../../types/dungeon"
import type Fight from "../../types/fight"
import type { Pull } from "../../types/fight"


const CLOSE_DELAY = 250  // ms, to move the mouse from the button into the popover


/** the quick select buttons: label, and the pulls they select */
const QUICK_SELECT: [string, (pulls: Pull[]) => number[]][] = [
    ["All", pulls => pulls.map((_, i) => i)],
    ["Trash", pulls => pulls.flatMap((pull, i) => pull.boss ? [] : [i])],
    ["Bosses", pulls => pulls.flatMap((pull, i) => pull.boss ? [i] : [])],
]

function same_set(a: number[], b: number[]) {
    return a.length == b.length && a.every(i => b.includes(i))
}


/** what the button says with some pulls selected: the single selected pull, or "3 of 12 pulls" */
function get_summary(pulls: Pull[], selected: number[]) {
    if (selected.length == 1) { return get_pull_label(pulls[selected[0]], selected[0]) }
    return `${selected.length} of ${pulls.length} pulls`
}


/**
 * Dropdown in the `DungeonInfo` of a dungeon run: picks the pulls the timeline shows,
 * and how the others show (dimmed or hidden) and which timestamps.
 * Click a pull to toggle it, Shift+click to select all pulls up to it. Nothing selected = the whole run.
 */
export default function PullSelect({ fight, dungeon }: { fight: Fight, dungeon: Dungeon | null }) {

    const dispatch = useAppDispatch()
    const selected = useAppSelector(state => get_pull_selection(state, fight))
    const settings = useAppSelector(get_view_settings)
    const [open, set_open_state] = useState(false)
    const [pinned, set_pinned] = useState(false)  // clicked or used: stays open when the mouse leaves
    const close_timer = useRef<number>(undefined)
    const container = useRef<HTMLDivElement>(null)
    const last_clicked = useRef<number | null>(null)  // start of a shift+click range

    const cancel_close = () => window.clearTimeout(close_timer.current)
    useEffect(() => cancel_close, [])

    function set_open(value: boolean) {
        cancel_close()
        set_open_state(value)
        if (!value) { set_pinned(false) }
    }

    // like the `FilterMenu`: opens on hover, closes a moment after the mouse leaves (time to move it into the popover)
    function on_pointer_enter(event: React.PointerEvent) {
        if (event.pointerType != "mouse") { return }
        set_open(true)
    }

    function on_pointer_leave(event: React.PointerEvent) {
        if (event.pointerType != "mouse" || pinned) { return }
        cancel_close()
        close_timer.current = window.setTimeout(() => set_open(false), CLOSE_DELAY)
    }

    function on_click_button() {
        if (open && pinned) { return set_open(false) }
        set_open(true)
        set_pinned(true)
    }

    // close when clicking anywhere else
    useEffect(() => {
        if (!open) { return }
        function on_mouse_down(event: globalThis.MouseEvent) {
            if (!container.current?.contains(event.target as Node)) { set_open(false) }
        }
        function on_key_down(event: KeyboardEvent) {
            if (event.key == "Escape") { set_open(false) }
        }
        document.addEventListener("mousedown", on_mouse_down)
        document.addEventListener("keydown", on_key_down)
        return () => {
            document.removeEventListener("mousedown", on_mouse_down)
            document.removeEventListener("keydown", on_key_down)
        }
    }, [open])

    const pulls = fight.pulls || []
    if (pulls.length == 0) { return null }
    const run_key = get_run_key(fight)

    function select(indices: number[]) {
        dispatch(set_pull_selection({ run_key, indices: [...new Set(indices)] }))
    }

    function on_click_pull(event: MouseEvent, index: number) {
        const anchor = last_clicked.current
        last_clicked.current = index

        if (event.shiftKey && anchor !== null) {
            const [from, to] = anchor < index ? [anchor, index] : [index, anchor]
            const range = Array.from({ length: to - from + 1 }, (_, i) => from + i)
            return select([...selected, ...range])
        }

        const is_selected = selected.includes(index)
        select(is_selected ? selected.filter(i => i != index) : [...selected, index])
    }

    return (
        <div ref={container} className={styles.container} onPointerEnter={on_pointer_enter} onPointerLeave={on_pointer_leave}>
            <button
                type="button"
                className={`${styles.button} ${open ? styles.open : ""} wow-dungeon wow-background`}
                onClick={on_click_button}
                aria-expanded={open}
            >
                <span className={styles.summary}>
                    {selected.length == 0 ? <DungeonRunTitle fight={fight} dungeon={dungeon} short /> : get_summary(pulls, selected)}
                </span>
                {selected.length == 0 && <span className={styles.duration}>{toMMSS(get_run_time(fight))}</span>}
                <FaCaretDown />
            </button>

            {open && (
                // using it pins it open (also: a native <select> menu would count as leaving)
                <div className={`${styles.popover} border rounded`} onPointerDown={() => set_pinned(true)}>
                    <DungeonRunInfo fight={fight} dungeon={dungeon} />
                    <hr className={styles.divider} />

                    <div className={styles.header}>
                        <span>{pulls.length} Pulls</span>
                        <span className={styles.hint}>(click to select, Shift+click: range)</span>
                    </div>

                    <div className={styles.chips}>
                        {pulls.map((pull, i) => (
                            <button
                                type="button"
                                key={i}
                                className={`${styles.chip} ${pull.boss ? styles.boss : ""} ${selected.includes(i) ? styles.selected : ""}`}
                                onMouseDown={event => event.shiftKey && event.preventDefault()}  // no text selection
                                onClick={event => on_click_pull(event, i)}
                                aria-pressed={selected.includes(i)}
                                data-tooltip={get_pull_time_info(pull)}
                                data-tooltip-size="small"
                            >
                                {get_pull_label(pull, i)}
                            </button>
                        ))}
                    </div>

                    <div className={styles.quick}>
                        <span>Select:</span>
                        {QUICK_SELECT.map(([label, get_indices]) => {
                            const indices = get_indices(pulls)
                            const active = same_set(indices.length == pulls.length ? [] : indices, selected)
                            return (
                                <button
                                    type="button"
                                    key={label}
                                    className={`${styles.quick_button} ${active ? styles.active : ""}`}
                                    onClick={() => select(indices.length == pulls.length ? [] : indices)}
                                    disabled={indices.length == 0}
                                >
                                    {label}
                                </button>
                            )
                        })}
                    </div>

                    <hr className={styles.divider} />

                    <div className={styles.options}>
                        <label>
                            <select
                                className={styles.select}
                                value={settings.hide_unselected_pulls ? "hide" : "dim"}
                                onChange={event => dispatch(set_view_setting("hide_unselected_pulls", event.target.value == "hide"))}
                            >
                                <option value="dim">Dim</option>
                                <option value="hide">Hide</option>
                            </select>
                            unselected pulls
                        </label>
                        <label>
                            Time relative to
                            <select
                                className={styles.select}
                                value={settings.timestamps}
                                onChange={event => dispatch(set_view_setting("timestamps", event.target.value as "run" | "pull"))}
                            >
                                <option value="run">Dungeon start</option>
                                <option value="pull">First selected pull</option>
                            </select>
                        </label>
                    </div>
                </div>
            )}
        </div>
    )
}
