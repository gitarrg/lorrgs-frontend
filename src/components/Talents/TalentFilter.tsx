/*
    Talents icon in the Spec Ranking settings bar, with the Talent Filter menu.
*/
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { get_spec } from "../../store/specs";
import { get_talent_tree, load_talent_tree } from "../../store/talent_trees";
import { useAppDispatch, useAppSelector } from "../../store/store_hooks";
import type { TalentFilter as TalentFilterValues } from "../../store/ui";
import { URL_PARAM, cycle_talent, format_talent_filter, useTalentCounts } from "./talent_filter";
import BuildButtons, { load_builds } from "./BuildButtons";
import TalentFilterTree from "./TalentFilterTree";
import FilterMenu from "../SettingsBar/shared/FilterMenu";
import styles from "./TalentFilter.module.scss";
import { ASSETS } from "../../constants";


function useSetTalentFilter() {
    const [, set_search_params] = useSearchParams()
    return (next: TalentFilterValues) => {
        set_search_params(params => {
            const value = format_talent_filter(next)
            value ? params.set(URL_PARAM, value) : params.delete(URL_PARAM)
            return params
        }, { replace: true })
    }
}


export default function TalentFilter() {
    const talent_filter = useAppSelector(state => state.ui.filters.talents)
    const set_talent_filter = useSetTalentFilter()
    const count = Object.keys(talent_filter).length

    return (
        <FilterMenu
            icon={`${ASSETS}/images/spells/ability_marksmanship.jpg`}
            label="Talents"
            active={count > 0}
            count={count}
            on_clear={() => set_talent_filter({})}
            extra={count == 0 && <span className={styles.new}>new</span>}
            menu_className={styles.menu}
        >
            <TalentFilterMenu />
        </FilterMenu>
    )
}


/** only mounted while the menu is open */
function TalentFilterMenu() {

    ////////////////////////////////////////////////////////////////////////////
    // Hooks
    const dispatch = useAppDispatch()
    const spec_slug = useAppSelector(state => state.ui.spec_slug)
    const tree = useAppSelector(state => get_talent_tree(state, spec_slug))
    const spec = useAppSelector(state => get_spec(state, spec_slug))
    const talent_filter = useAppSelector(state => state.ui.filters.talents)
    const set_talent_filter = useSetTalentFilter()
    const { counts, with_talents, without_talents } = useTalentCounts()
    const [preview, set_preview] = useState<TalentFilterValues | null>(null)  // of the hovered Build button

    // only once the menu shows: both stay cached after
    useEffect(() => {
        if (!spec_slug) { return }
        dispatch(load_talent_tree(spec_slug))
        load_builds(spec_slug)
    }, [spec_slug])

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
    /** choice nodes only allow one of their entries: picking one drops the other */
    function on_tree_click(entry_id: number) {
        const next = cycle_talent(talent_filter, entry_id)
        if (!talent_filter[entry_id]) {
            const node = tree?.nodes.find(node => node.entries.some(entry => entry.id == entry_id))
            node?.entries.forEach(entry => { if (entry.id != entry_id) { delete next[entry.id] } })
        }
        set_talent_filter(next)
    }

    function remove_talent(entry_id: number) {
        const next = { ...talent_filter }
        delete next[entry_id]
        set_talent_filter(next)
    }

    ////////////////////////////////////////////////////////////////////////////
    // Render
    let tree_content = <TalentFilterTree
        tree={tree!}
        spec={spec}
        talent_filter={talent_filter}
        preview={preview}
        share={share}
        on_click={on_tree_click}
        on_clear={remove_talent}
    />
    if (tree === undefined) { tree_content = <div className={styles.note}>Loading talents...</div> }
    if (tree === null) { tree_content = <div className={styles.note}>No talent tree for this spec</div> }

    const info = <>
        <b>Click</b> once to <span className={styles.with}>include</span>,&nbsp;
        <b>click twice</b> to <span className={styles.without}>exclude</span>,&nbsp;
        <b>right click</b> to <span className={styles.clear}>clear</span>
    </>


    return (
        <>
            <div className={styles.body}>
                <div className={styles.body_tree}>{tree_content}</div>
                <BuildButtons spec_slug={spec_slug} tree={tree} talent_filter={talent_filter} on_change={set_talent_filter} on_hover={set_preview} />
            </div>

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

                {selected.length == 0 && <span className={styles.note}>{info}</span>}
            </div>

            {selected.length > 0 && without_talents > 0 &&
                <div className={styles.note}>{without_talents} fights without talent data hidden</div>
            }
        </>
    )
}
