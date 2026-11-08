/*
    Picking the phases of boss fights to show (the others are dimmed or hidden), shared by the ruler,
    the boss card and the corner. Phases are picked by name (eg. "P2") and apply to all fights.

    Click (card, corner): toggles a phase.
    Ctrl/Cmd+click (ruler): toggles a phase: that extends the selection.
    Shift+click: all phases from the last selected one.
*/
import store from "../../store/store"
import { set_phase_selection } from "../../store/ui"
import { get_fights } from "../../store/fights"
import { get_phase_names } from "../../pulls"


/** hints for the ruler's tooltip, one row each */
export const RULER_HINTS = ["Click: align by phase", "Ctrl+click: select phase", "Right-click: reset"]


/** names of the phases of the boss of the fights shown, in order */
export function get_all_phase_names(boss_slug?: string) {
    return get_phase_names(get_fights(store.getState()), boss_slug)
}


/** the new selection after a click on `name`. `phases`: all names, in order. */
export function click_phase(phases: string[], selection: string[], name: string, event: { shiftKey: boolean }): string[] {
    const selected = selection.filter(n => phases.includes(n))
    if (event.shiftKey && selected.length) {
        const [from, to] = [phases.indexOf(selected[selected.length - 1]), phases.indexOf(name)].sort((a, b) => a - b)
        return [...new Set([...selected, ...phases.slice(from, to + 1)])]
    }
    return selected.includes(name) ? selected.filter(n => n != name) : [...selected, name]
}


/** whether a click on the ruler is meant to select (and not align) */
export function is_select_click(event: { ctrlKey: boolean, metaKey: boolean, shiftKey: boolean }) {
    return event.ctrlKey || event.metaKey || event.shiftKey
}


export function select_phase(boss_slug: string | undefined, name: string, event: { shiftKey: boolean }) {
    const { dispatch, getState } = store
    dispatch(set_phase_selection(click_phase(get_all_phase_names(boss_slug), getState().ui.phase_selection, name, event)))
}


export function clear_phase_selection() {
    if (!store.getState().ui.phase_selection.length) { return }
    store.dispatch(set_phase_selection([]))
}


export function has_phase_selection() {
    return store.getState().ui.phase_selection.length > 0
}
