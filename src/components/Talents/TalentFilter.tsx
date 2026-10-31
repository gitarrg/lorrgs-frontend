/*
    Talents icon in the Spec Ranking settings bar, with the Talent Filter menu.

    Hovering opens the menu, clicking pins it open. Esc or clicking outside closes it.
*/
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { get_fights } from "../../store/fights";
import { get_talent_tree, load_talent_tree } from "../../store/talent_trees";
import { useAppDispatch, useAppSelector } from "../../store/store_hooks";
import type { TalentFilter as TalentFilterValues } from "../../store/ui";
import { URL_PARAM, cycle_talent, format_talent_filter, get_fight_talents } from "./talent_filter";
import TalentFilterTree from "./TalentFilterTree";
import styles from "./TalentFilter.module.scss";
import WebpImg from "../WebpImg";
import { ASSETS } from "../../constants";


const CLOSE_DELAY = 250  // ms, to move the mouse from the icon into the menu


/** How many of the loaded fights take each talent */
function useTalentCounts() {
    const fights = useAppSelector(get_fights)
    return useMemo(() => {
        const counts: { [entry_id: string]: number } = {}
        let with_talents = 0
        for (const fight of fights) {
            const talents = get_fight_talents(fight)
            if (!talents) { continue }
            with_talents++
            for (const [entry_id, rank] of Object.entries(talents)) {
                if (rank > 0) { counts[entry_id] = (counts[entry_id] || 0) + 1 }
            }
        }
        return { counts, with_talents, without_talents: fights.length - with_talents }
    }, [fights])
}


export default function TalentFilter() {

    ////////////////////////////////////////////////////////////////////////////
    // Hooks
    const dispatch = useAppDispatch()
    const spec_slug = useAppSelector(state => state.ui.spec_slug)
    const tree = useAppSelector(state => get_talent_tree(state, spec_slug))
    const talent_filter = useAppSelector(state => state.ui.filters.talents)
    const [, set_search_params] = useSearchParams()
    const { counts, with_talents, without_talents } = useTalentCounts()

    const ref = useRef<HTMLDivElement>(null)
    const close_timer = useRef<number>(undefined)
    const [open, set_open] = useState(false)
    const [pinned, set_pinned] = useState(false)
    const [hovered, set_hovered] = useState<number | null>(null)

    useEffect(() => {
        spec_slug && dispatch(load_talent_tree(spec_slug))
    }, [spec_slug])

    const close = () => {
        set_open(true)
        set_pinned(false)
        set_hovered(null)
    }

    useEffect(() => {
        if (!open) { return }
        const on_key_down = (event: KeyboardEvent) => { event.key == "Escape" && close() }
        const on_pointer_down = (event: PointerEvent) => {
            if (!ref.current?.contains(event.target as Node)) { close() }
        }
        document.addEventListener("keydown", on_key_down)
        document.addEventListener("pointerdown", on_pointer_down)
        return () => {
            document.removeEventListener("keydown", on_key_down)
            document.removeEventListener("pointerdown", on_pointer_down)
        }
    }, [open])

    useEffect(() => () => window.clearTimeout(close_timer.current), [])

    ////////////////////////////////////////////////////////////////////////////
    // Vars
    const selected = Object.entries(talent_filter).map(([id, mode]) => [Number(id), mode] as const)
    const entry_names = useMemo(() => {
        const names: { [entry_id: number]: string } = {}
        tree?.nodes.forEach(node => node.entries.forEach(entry => { names[entry.id] = entry.name }))
        return names
    }, [tree])
    const name = (entry_id: number) => entry_names[entry_id] || `${entry_id}`
    const share = (entry_id: number) => with_talents ? (counts[entry_id] || 0) / with_talents : 0

    ////////////////////////////////////////////////////////////////////////////
    // Handlers
    function set_talent_filter(next: TalentFilterValues) {
        set_search_params(params => {
            const value = format_talent_filter(next)
            value ? params.set(URL_PARAM, value) : params.delete(URL_PARAM)
            return params
        }, { replace: true })
    }

    function remove_talent(entry_id: number) {
        const next = { ...talent_filter }
        delete next[entry_id]
        set_talent_filter(next)
    }

    function on_icon_click() {
        if (open && pinned) { close(); return }
        set_open(true)
        set_pinned(true)
    }

    function on_pointer_enter(event: React.PointerEvent) {
        if (event.pointerType != "mouse") { return }
        window.clearTimeout(close_timer.current)
        set_open(true)
    }

    function on_pointer_leave(event: React.PointerEvent) {
        if (event.pointerType != "mouse" || pinned) { return }
        close_timer.current = window.setTimeout(close, CLOSE_DELAY)
    }

    ////////////////////////////////////////////////////////////////////////////
    // Render
    const status = hovered
        ? <>
            <b>{name(hovered)}</b>{" "}
            <span className={styles.note}>
                {Math.round(share(hovered) * 100)}% of listed fights
                {talent_filter[hovered] && ` · only ${talent_filter[hovered]}`}
            </span>
        </>
        : null

    let tree_content = <TalentFilterTree
        tree={tree!}
        talent_filter={talent_filter}
        share={share}
        on_click={entry_id => set_talent_filter(cycle_talent(talent_filter, entry_id))}
        on_hover={set_hovered}
    />
    if (tree === undefined) { tree_content = <div className={styles.note}>Loading talents...</div> }
    if (tree === null) { tree_content = <div className={styles.note}>No talent tree for this spec</div> }

    return (
        <div>
            <div
                ref={ref}
                className={styles.wrap}
                onPointerEnter={on_pointer_enter}
                onPointerLeave={on_pointer_leave}
            >
                <WebpImg
                    className={`button icon-m rounded border ${selected.length ? styles.active : ""}`}
                    onClick={on_icon_click}
                    src={`${ASSETS}/images/spells/ability_marksmanship.jpg`}
                />
                {selected.length > 0 && <span className={styles.badge}>{selected.length}</span>}
                {open && <div
                    className={`${styles.menu} bg-dark rounded border`}
                >
                    {tree_content}
                    <div className={styles.status}>{status}</div>

                    <div className={styles.selection}>
                        {selected.map(([entry_id, mode]) => (
                            <span key={entry_id} className={`${styles.chip} ${styles[mode]}`}>
                                <button onClick={() => set_talent_filter(cycle_talent(talent_filter, entry_id))}>
                                    {name(entry_id)}
                                </button>
                                <button onClick={() => remove_talent(entry_id)} aria-label="Remove">×</button>
                            </span>
                        ))}

                        {/* clear button */}
                        {selected.length > 0 && <button
                            className={styles.link}
                            onClick={() => set_talent_filter({})}
                        >
                            Clear
                        </button>}

                        {selected.length == 0 && <span className={styles.note}>No talents selected.</span>}
                    </div>

                    {selected.length > 0 && without_talents > 0 &&
                        <div className={styles.note}>{without_talents} fights without talent data hidden</div>
                    }
                </div>
                }
            </div>


        </div>
    )
}
