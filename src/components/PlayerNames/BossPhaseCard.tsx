/*
    Card of a boss fight, shown on hover over its `BossName`: picks the phases the timeline shows,
    and how the others show (dimmed or hidden). Like the `PullSelect` of a dungeon run, but simpler.

    Phases are picked by name (eg. "P2") and apply to all fights shown.
    Rendered into the body (the names list clips its overflow) at a fixed position below the name.
*/
import { useMemo, type MouseEvent } from "react"
import { createPortal } from "react-dom"
import styles from "./PullSelect.module.scss"
import card_styles from "./BossPhaseCard.module.scss"
import { PHASE_COLOR, get_phase_spans } from "../../pulls"
import { get_fights } from "../../store/fights"
import { get_view_settings, set_view_setting } from "../../store/report_links"
import { set_phase_selection } from "../../store/ui"
import { useAppDispatch, useAppSelector } from "../../store/store_hooks"
import WebpImg from "../WebpImg"
import type Fight from "../../types/fight"


/** names of the phases of the fights of this boss, in order ("P1", "P2", "P2.5"...) */
export function get_phase_names(fights: Fight[], boss_slug?: string) {
    const names = new Set<string>()
    fights
        .filter(fight => fight.boss?.boss_slug == boss_slug)
        .forEach(fight => get_phase_spans(fight).forEach(span => names.add(span.name!)))
    return [...names].sort((a, b) => parseFloat(a.slice(1)) - parseFloat(b.slice(1)))
}


/** the phase names of the boss, or none (then there is nothing to pick: no card) */
export function usePhaseNames(fight: Fight) {
    const fights = useAppSelector(get_fights)
    return useMemo(() => get_phase_names(fights, fight.boss?.boss_slug), [fights, fight.boss?.boss_slug])
}


const CARD_WIDTH = 360  // px, a bit more than the card (see the stylesheet)


type Props = {
    fight: Fight
    boss_name: string
    icon_path: string
    phases: string[]
    anchor: DOMRect
    on_pointer_enter: () => void
    on_pointer_leave: () => void
}


export default function BossPhaseCard({ boss_name, icon_path, phases, anchor, on_pointer_enter, on_pointer_leave }: Props) {

    const dispatch = useAppDispatch()
    const selection = useAppSelector(state => state.ui.phase_selection)
    const settings = useAppSelector(get_view_settings)
    const selected = selection.filter(name => phases.includes(name))

    function on_click_phase(event: MouseEvent, name: string) {
        // shift+click: all phases from the last selected one
        if (event.shiftKey && selected.length) {
            const [from, to] = [phases.indexOf(selected[selected.length - 1]), phases.indexOf(name)].sort((a, b) => a - b)
            return dispatch(set_phase_selection([...selected, ...phases.slice(from, to + 1)]))
        }
        dispatch(set_phase_selection(selected.includes(name) ? selected.filter(n => n != name) : [...selected, name]))
    }

    return createPortal(
        <div
            className={`${card_styles.card} bg-dark border rounded`}
            style={{ left: Math.max(0, Math.min(anchor.left, window.innerWidth - CARD_WIDTH)), top: anchor.bottom + 2 }}
            onPointerEnter={on_pointer_enter}
            onPointerLeave={on_pointer_leave}
        >
            <div className={card_styles.title}>
                <WebpImg className={card_styles.icon} src={icon_path} alt="" />
                <span>{boss_name}</span>
            </div>

            <hr className={styles.divider} />

            <div className={styles.header}>
                <span>Phases</span>
                <span className={styles.hint}>(click to select, Shift+click: range)</span>
            </div>

            <div className={styles.chips}>
                {phases.map(name => (
                    <button
                        type="button"
                        key={name}
                        className={`${styles.chip} ${selected.includes(name) ? styles.selected : ""}`}
                        style={{ "--chip-color": PHASE_COLOR } as React.CSSProperties}
                        onMouseDown={event => event.shiftKey && event.preventDefault()}  // no text selection
                        onClick={event => on_click_phase(event, name)}
                        aria-pressed={selected.includes(name)}
                    >
                        {name}
                    </button>
                ))}
            </div>

            <div className={styles.quick}>
                <span>Select:</span>
                <button
                    type="button"
                    className={`${styles.quick_button} ${selected.length == 0 ? styles.active : ""}`}
                    onClick={() => dispatch(set_phase_selection([]))}
                >
                    All
                </button>
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
                    unselected phases
                </label>
                <label>
                    Time relative to
                    <select
                        className={styles.select}
                        value={settings.timestamps}
                        onChange={event => dispatch(set_view_setting("timestamps", event.target.value as "run" | "pull"))}
                    >
                        <option value="run">Pull start</option>
                        <option value="pull">First selected phase</option>
                    </select>
                </label>
            </div>
        </div>,
        document.body,
    )
}
