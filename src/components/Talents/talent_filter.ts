/*
    Talent Filter: show only fights with/without some talents.

    Kept in the url as `?talents=<entry id>,-<entry id>` ("-" for "only without").
*/
import { useMemo } from "react"
import { get_fights } from "../../store/fights"
import { useAppSelector } from "../../store/store_hooks"
import type { TalentFilter } from "../../store/ui"
import type Fight from "../../types/fight"
import type { Talents } from "../../types/talent_tree"


export const URL_PARAM = "talents"


export function parse_talent_filter(value: string | null): TalentFilter {
    const talent_filter: TalentFilter = {}
    for (const part of (value || "").split(",")) {
        const id = parseInt(part)
        if (!id) { continue }
        talent_filter[Math.abs(id)] = id > 0 ? "with" : "without"
    }
    return talent_filter
}


export function format_talent_filter(talent_filter: TalentFilter): string {
    return Object.entries(talent_filter)
        .map(([id, mode]) => (mode == "with" ? "" : "-") + id)
        .join(",")
}


/** only with → only without → off */
export function cycle_talent(talent_filter: TalentFilter, entry_id: number): TalentFilter {
    const next = { ...talent_filter }
    const mode = next[entry_id]
    if (!mode) { next[entry_id] = "with" }
    else if (mode == "with") { next[entry_id] = "without" }
    else { delete next[entry_id] }
    return next
}


/** Talents of the ranked player of a fight. `undefined` if there are none */
export function get_fight_talents(fight: Fight): Talents | undefined {
    return fight.players.find(player => player.talents && Object.keys(player.talents).length)?.talents
}


/** Every "with" talent (at any rank) and none of the "without" ones. Fights without talents never match an active filter */
export function fight_matches_talents(fight: Fight, talent_filter: TalentFilter | undefined): boolean {
    const selected = Object.entries(talent_filter || {})
    if (!selected.length) { return true }

    const talents = get_fight_talents(fight)
    if (!talents) { return false }

    return selected.every(([id, mode]) => (talents[id] > 0) == (mode == "with"))
}


/** How many of the loaded fights take each talent */
export function useTalentCounts() {
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
        return {
            counts,
            with_talents,
            without_talents: fights.length - with_talents,
        }
    }, [fights])
}
