/*
    One button per Build of the spec (see the backend's `/builds/{spec_slug}`), left of the tree in the Talent Filter menu.

    Each player of the listed fights goes to one Build, or none ("cooked their own"), by the backend's rules
    (`build_assign.ts`): so the shares and counts add up. Sorted by share, coloured by rank like item qualities;
    Builds nobody here plays are greyed out. Each also shows its hero tree and the talents that tell it from the others.
    Clicking one sets the Talent Filter to the talents that make up the Build (see `build_filter.ts`).
    Clicking the active one clears it again. Hovering one shows its talents on the tree.
*/
import { useEffect, useMemo, useState } from "react";
import { fetch_versioned } from "../../api";
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
import styles from "./TalentFilter.module.scss";


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


/** like the item qualities: the most played Build first */
const SHARE_COLORS = ["wow-artifact", "wow-legendary", "wow-epic", "wow-rare", "wow-uncommon"]


export default function BuildButtons({ spec_slug, tree, talent_filter, on_change, on_hover }: Props) {

    const fights_on_page = useAppSelector(get_fights)
    const [data, set_data] = useState<{ spec_slug: string, builds: SpecBuilds } | null>(null)

    useEffect(() => {
        if (!spec_slug) { return }
        let cancelled = false
        fetch_versioned(`/builds/${spec_slug}`).then(builds => {
            if (!cancelled && builds && !builds.error) { set_data({ spec_slug, builds }) }
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

    return <div className={styles.builds}>
        {sorted.map(({ build, count }, rank) => {
            const { filter, key_talents } = build_preset_filter(tree, build, builds.filter(other => other != build))
            const active = format_talent_filter(filter) == format_talent_filter(talent_filter)
            const percent = total ? Math.round(100 * count / total) : 0
            const global_percent = fights ? Math.round(100 * build.fights / fights) : 0
            return (
                <button
                    key={build.letter}
                    className={`${styles.build} ${active ? styles.build_active : ""} ${count ? "" : styles.build_unplayed}`}
                    title={`Build ${build.letter}: ${count} of ${total} players here, ${global_percent}% of all ranked fights`}
                    onClick={() => on_change(active ? {} : filter)}
                    onPointerEnter={() => on_hover(filter)}
                    onPointerLeave={() => on_hover(null)}
                >
                    {build.hero_tree && <WebpImg
                        className={styles.build_hero}
                        src={`${ASSETS}/images/hero_trees/${build.hero_tree}.png`}
                    />}
                    <span className={styles.build_share}>
                        <span className={count ? SHARE_COLORS[Math.min(rank, SHARE_COLORS.length - 1)] : ""}>{percent}%</span>
                        <span className={`${styles.build_count} text-muted`}>{count}/{total} players</span>
                    </span>
                    <span className={styles.build_talents}>
                        {key_talents.map(id => entries[id]?.icon && <WebpImg
                            key={id}
                            className={`${styles.build_talent} border rounded`}
                            src={`${ASSETS}/images/spells/${entries[id].icon}`}
                            title={entries[id].name}
                        />)}
                    </span>
                </button>
            )
        })}
        {total > 0 && <span className={`${styles.build_own} text-muted`}>{own}/{total} players cooked their own builds</span>}
    </div>
}
