/* Pulls of a dungeon run: shown as bands in the run's `PullRow`, and picked in its `PullSelect`. */
import { toMMSS } from "./utils"
import type Fight from "./types/fight"
import type { Pull } from "./types/fight"


export const PULL_COLOR = "#5b9bd5"
export const BOSS_PULL_COLOR = "#e6b422"
export const PHASE_COLOR = "#36b336"


/** name of a pull: the boss, or "Pull #n" for trash (`index`: position in the run's pulls). Phases: "P2" */
export function get_pull_label(pull: Pull, index: number) {
    return pull.name || pull.boss || `Pull #${index + 1}`
}


export function get_pull_color(pull: Pull) {
    if (pull.name) { return PHASE_COLOR }
    return pull.boss ? BOSS_PULL_COLOR : PULL_COLOR
}


/**
 * The phases of a boss fight as back to back "pulls" (P1 runs until the first phase starts),
 * so they go through the same `TimeMap` as the pulls of a dungeon run.
 * Empty for dungeon runs and fights without phases.
 */
export function get_phase_spans(fight: Fight): Pull[] {
    const phases = fight.phases || []
    if (!phases.length || fight.pulls?.length) { return [] }

    const bounds = [{ name: "P1", ts: 0 }, ...phases.filter(phase => phase.ts > 0)]
    return bounds.map((phase, i) => ({
        start: phase.ts,
        end: i + 1 < bounds.length ? bounds[i + 1].ts : Math.max(fight.duration, phase.ts),
        boss: null,
        name: phase.name,
    }))
}


/** names of the phases of the fights of this boss, in order ("P1", "P2", "P2.5"...) */
export function get_phase_names(fights: Fight[], boss_slug?: string) {
    const names = new Set<string>()
    fights
        .filter(fight => fight.boss?.boss_slug == boss_slug)
        .forEach(fight => get_phase_spans(fight).forEach(span => names.add(span.name!)))
    return [...names].sort((a, b) => parseFloat(a.slice(1)) - parseFloat(b.slice(1)))
}


/** "01:20 - 02:05 (00:45)": start - end in run time, and the duration */
export function get_pull_time_info(pull: Pull) {
    const start = toMMSS(pull.start / 1000)
    const end = toMMSS(pull.end / 1000)
    const duration = toMMSS((pull.end - pull.start) / 1000)
    return `${start} - ${end} (${duration})`
}
