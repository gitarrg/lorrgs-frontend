/*
    One button per Build of the spec (see the backend's `/builds/{spec_slug}`), on top of the Talent Filter menu.

    Clicking one sets the Talent Filter to the talents that make up the Build (see `build_filter.ts`).
    Clicking the active one clears it again. Hovering one shows its talents on the tree.
*/
import { useEffect, useState } from "react";
import { fetch_versioned } from "../../api";
import type { TalentFilter } from "../../store/ui";
import type TalentTree from "../../types/talent_tree";
import { build_preset_filter, type BuildDefinition } from "./build_filter";
import { format_talent_filter } from "./talent_filter";
import styles from "./TalentFilter.module.scss";


interface Build extends BuildDefinition {
    letter: string
    fights: number
}

interface SpecBuilds {
    fights: number
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


export default function BuildButtons({ spec_slug, tree, talent_filter, on_change, on_hover }: Props) {

    const [data, set_data] = useState<{ spec_slug: string, builds: SpecBuilds } | null>(null)

    useEffect(() => {
        if (!spec_slug) { return }
        let cancelled = false
        fetch_versioned(`/builds/${spec_slug}`).then(builds => {
            if (!cancelled && builds && !builds.error) { set_data({ spec_slug, builds }) }
        })
        return () => { cancelled = true }
    }, [spec_slug])

    if (data?.spec_slug != spec_slug) { return null }
    const { fights, builds } = data.builds
    if (!tree) { return null }
    if (builds.length < 2) { return null }  // a single Build has no defining talents

    return <div className={styles.builds}>
        {builds.map(build => {
            const filter = build_preset_filter(tree, build, builds.filter(other => other != build))
            const active = format_talent_filter(filter) == format_talent_filter(talent_filter)
            return (
                <button
                    key={build.letter}
                    className={`button rounded border ${active ? "active" : ""}`}
                    title={`Build ${build.letter}: ${build.hero_tree ?? ""} (${build.fights} of ${fights} ranked fights)`}
                    onClick={() => on_change(active ? {} : filter)}
                    onPointerEnter={() => on_hover(filter)}
                    onPointerLeave={() => on_hover(null)}
                >
                    {build.letter} {fights ? Math.round(100 * build.fights / fights) : 0}%
                </button>
            )
        })}
    </div>
}
