/*
    One button per Build of the spec (see the backend's `/builds/{spec_slug}`), right of the tree in the Talent Filter menu.

    Each player of the listed fights goes to one Build, or none ("cooked their own"), by the backend's rules
    (`build_assign.ts`): so the shares and counts add up. Sorted by share (in the tooltip); Builds nobody here plays
    are greyed out. Each shows its hero tree and the talents that tell it from the others.
    Clicking one sets the Talent Filter to the talents that make up the Build (see `build_filter.ts`).
    Clicking the active one clears it again. Hovering one shows its talents on the tree.
*/
import { useEffect, useMemo, useState } from "react";
import { fetch_versioned, versioned } from "../../api";
import { ASSETS } from "../../constants";
import { get_fights } from "../../store/fights";
import { useAppSelector } from "../../store/store_hooks";
import type { TalentFilter } from "../../store/ui";
import type TalentTree from "../../types/talent_tree";
import type { TalentEntry } from "../../types/talent_tree";
import WebpImg from "../WebpImg";
import { build_assigner, talent_scope, type BuildSettings } from "./build_assign";
import { build_preset_filter, type BuildDefinition } from "./build_filter";
import { format_talent_filter, get_fight_talents } from "./talent_filter";
import styles from "./BuildButtons.module.scss";


interface Build extends BuildDefinition {
    letter: string
    fights: number
}

interface SpecBuilds {
    fights: number
    settings: BuildSettings
    builds: Build[]
}


interface Props {
    spec_slug: string
    tree: TalentTree | null | undefined
    talent_filter: TalentFilter
    on_change: (next: TalentFilter) => void
    /** the filter of the hovered button, `null` when leaving it */
    on_hover: (filter: TalentFilter | null) => void
}


/** loaded Builds by versioned path: the menu (and these buttons with it) mounts on every hover, loading them once */
const loaded = new Map<string, SpecBuilds | null>()
const loading = new Map<string, Promise<SpecBuilds | null>>()


/** Load the Builds of a spec, once */
export function load_builds(spec_slug: string): Promise<SpecBuilds | null> {
    const path = versioned(`/builds/${spec_slug}`)
    if (!loading.has(path)) {
        loading.set(path, fetch_versioned(`/builds/${spec_slug}`).then(builds => {
            const result = builds && !builds.error ? builds as SpecBuilds : null
            if (builds) { loaded.set(path, result) }  // `null`: switched Game Version meanwhile, try again next time
            else { loading.delete(path) }
            return result
        }).catch(() => {
            loading.delete(path)  // try again next time
            return null
        }))
    }
    return loading.get(path)!
}


export default function BuildButtons({ spec_slug, tree, talent_filter, on_change, on_hover }: Props) {

    const fights_on_page = useAppSelector(get_fights)
    const cached = spec_slug ? loaded.get(versioned(`/builds/${spec_slug}`)) : undefined
    const [data, set_data] = useState<{ spec_slug: string, builds: SpecBuilds } | null>(
        cached ? { spec_slug, builds: cached } : null,
    )

    useEffect(() => {
        if (!spec_slug || data?.spec_slug == spec_slug) { return }
        let cancelled = false
        load_builds(spec_slug).then(builds => {
            if (!cancelled && builds) { set_data({ spec_slug, builds }) }
        })
        return () => { cancelled = true }
    }, [spec_slug])

    const entries = useMemo(() => {
        const by_id: { [entry_id: number]: TalentEntry } = {}
        tree?.nodes.forEach(node => node.entries.forEach(entry => { by_id[entry.id] = entry }))
        return by_id
    }, [tree])

    // players on this page per Build (`null`: none of them)
    const counts = useMemo(() => {
        const counts = new Map<number | null, number>()
        if (!tree || data?.spec_slug != spec_slug) { return counts }
        const assign = build_assigner(data.builds.builds, talent_scope(tree), data.builds.settings)
        fights_on_page.forEach(fight => {
            const talents = get_fight_talents(fight)
            if (!talents) { return }
            const index = assign(talents)
            counts.set(index, (counts.get(index) || 0) + 1)
        })
        return counts
    }, [tree, data, spec_slug, fights_on_page])

    if (data?.spec_slug != spec_slug || !tree) { return null }
    const { fights, builds } = data.builds
    if (builds.length < 2) { return null }  // nothing to pick between

    const total = [...counts.values()].reduce((a, b) => a + b, 0)
    const own = counts.get(null) || 0
    const sorted = builds
        .map((build, index) => ({ build, count: counts.get(index) || 0 }))
        .sort((a, b) => b.count - a.count || b.build.fights - a.build.fights)

    return <div className={styles.builds} data-builds>
        <span className="text-label">Builds</span>
        {sorted.map(({ build, count }) => {
            const { filter, key_talents } = build_preset_filter(tree, build, builds.filter(other => other != build))
            const active = format_talent_filter(filter) == format_talent_filter(talent_filter)
            const percent = total ? Math.round(100 * count / total) : 0
            const global_percent = fights ? Math.round(100 * build.fights / fights) : 0
            const toggle = () => on_change(active ? {} : filter)
            // a div: the talents inside are wowhead links, which a button can't hold
            return (
                <div
                    key={build.letter}
                    role="button"
                    tabIndex={0}
                    className={`${styles.build} button ${active ? styles.active : ""} ${count ? "" : styles.unplayed}`}
                    onClick={toggle}
                    onKeyDown={event => { if (event.key == "Enter" || event.key == " ") { event.preventDefault(); toggle() } }}
                    onPointerEnter={() => on_hover(filter)}
                    onPointerLeave={() => on_hover(null)}
                >
                    {build.hero_tree && <WebpImg
                        className={`${styles.hero} icon-s`}
                        src={`${ASSETS}/images/hero_trees/${build.hero_tree}.png`}
                    />}
                    <span
                        data-tooltip={`${percent}% - ${count}/${total} players on this boss\n${global_percent}% across all bosses`}
                    >
                        {percent}% <span className="text-muted">({count}/{total})</span>
                    </span>
                    <span className={styles.talents}>
                        {key_talents.map(id => entries[id]?.icon && <a
                            key={id}
                            href=""
                            data-wowhead={`spell=${entries[id].spell_id}`}
                            onClick={event => event.preventDefault()}  // the click goes on to the card
                        >
                            <WebpImg className="icon-s border rounded" src={`${ASSETS}/images/spells/${entries[id].icon}`} />
                        </a>)}
                    </span>
                </div>
            )
        })}
        {total > 0 && own > 0 && <span className="text-muted text-small">{own}/{total} players cooked their own builds</span>}
        <span className="text-muted text-small">
            Builds are generated based on<br />
            <b>all</b> bosses once per day.</span>
    </div>
}
