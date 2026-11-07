import { useEffect, useRef, useState, type MouseEvent } from "react"
import { FaCaretDown } from "react-icons/fa"
import styles from "./PullSelect.module.scss"
import { get_pull_label, get_pull_time_info } from "../../pulls"
import { get_pull_selection, get_run_key, set_pull_selection } from "../../store/ui"
import { get_view_settings, set_view_setting } from "../../store/report_links"
import { useAppDispatch, useAppSelector } from "../../store/store_hooks"
import type Fight from "../../types/fight"
import type { Pull } from "../../types/fight"


/** what the button says: "All pulls", the single selected pull, or "3 of 12 pulls" */
function get_summary(pulls: Pull[], selected: number[]) {
    if (selected.length == 0) { return "All pulls" }
    if (selected.length == 1) { return get_pull_label(pulls[selected[0]], selected[0]) }
    return `${selected.length} of ${pulls.length} pulls`
}


/**
 * Names column cell next to the `PullRow` of a dungeon run: picks the pulls the timeline shows,
 * and how the others show (dimmed or hidden) and which timestamps.
 * Click a pull to toggle it, Shift+click to select all pulls up to it. Nothing selected = the whole run.
 */
export default function PullSelect({ fight }: { fight: Fight }) {

    const dispatch = useAppDispatch()
    const selected = useAppSelector(state => get_pull_selection(state, fight))
    const settings = useAppSelector(get_view_settings)
    const [open, set_open] = useState(false)
    const container = useRef<HTMLDivElement>(null)
    const last_clicked = useRef<number | null>(null)  // start of a shift+click range

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
        <div ref={container} className={styles.container}>
            <button
                type="button"
                className={`${styles.button} ${open ? styles.open : ""}`}
                onClick={() => set_open(!open)}
                aria-expanded={open}
                title="Select the pulls to show"
            >
                <span className={styles.summary}>{get_summary(pulls, selected)}</span>
                <FaCaretDown />
            </button>

            {open && (
                <div className={`${styles.popover} bg-dark border rounded`}>
                    <div className={styles.header}>
                        <span>Pulls</span>
                        <span className={styles.hint}>Click: toggle · Shift+click: range</span>
                        <button type="button" className={styles.clear} onClick={() => select([])} disabled={selected.length == 0}>
                            All
                        </button>
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

                    <div className={styles.options}>
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.hide_unselected_pulls}
                                onChange={event => dispatch(set_view_setting("hide_unselected_pulls", event.target.checked))}
                            />
                            Hide unselected pulls (instead of dimming them)
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.timestamps == "pull"}
                                onChange={event => dispatch(set_view_setting("timestamps", event.target.checked ? "pull" : "run"))}
                            />
                            Timestamps from the first selected pull
                        </label>
                    </div>
                </div>
            )}
        </div>
    )
}
