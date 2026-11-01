/*
    One button per Build of the spec (see the backend's `/builds/{spec_slug}`), on top of the Talent Filter menu.

    Clicking one sets the Talent Filter to the defining talents of the Build:
    "only with" for the talents only it has, "only without" for those every other Build has.
    Clicking the active one clears it again.
*/
import { useEffect, useState } from "react";
import { fetch_versioned } from "../../api";
import type { TalentFilter } from "../../store/ui";
import { format_talent_filter } from "./talent_filter";
import styles from "./TalentFilter.module.scss";


interface Build {
    letter: string
    fights: number
    hero_tree: string | null
    defining: { has: { [entry_id: string]: number }, lacks: { [entry_id: string]: number } }
}

interface SpecBuilds {
    fights: number
    builds: Build[]
}


function build_filter(build: Build): TalentFilter {
    const filter: TalentFilter = {}
    Object.keys(build.defining.has).forEach(id => { filter[Number(id)] = "with" })
    Object.keys(build.defining.lacks).forEach(id => { filter[Number(id)] = "without" })
    return filter
}


interface Props {
    spec_slug: string
    talent_filter: TalentFilter
    on_change: (next: TalentFilter) => void
}


export default function BuildButtons({ spec_slug, talent_filter, on_change }: Props) {

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
    if (builds.length < 2) { return null }  // a single Build has no defining talents

    return <div className={styles.builds}>
        {builds.map(build => {
            const filter = build_filter(build)
            const active = format_talent_filter(filter) == format_talent_filter(talent_filter)
            return (
                <button
                    key={build.letter}
                    className={`button rounded border ${active ? "active" : ""}`}
                    title={`Build ${build.letter}: ${build.hero_tree ?? ""} (${build.fights} of ${fights} ranked fights)`}
                    onClick={() => on_change(active ? {} : filter)}
                >
                    {build.letter} {fights ? Math.round(100 * build.fights / fights) : 0}%
                </button>
            )
        })}
    </div>
}
