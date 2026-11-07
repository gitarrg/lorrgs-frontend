/* Pulls of a dungeon run: shown as bands in the run's `PullRow`, and picked in its `PullSelect`. */
import { toMMSS } from "./utils"
import type { Pull } from "./types/fight"


export const PULL_COLOR = "#5b9bd5"
export const BOSS_PULL_COLOR = "#e6b422"


/** name of a pull: the boss, or "Pull #n" for trash (`index`: position in the run's pulls) */
export function get_pull_label(pull: Pull, index: number) {
    return pull.boss || `Pull #${index + 1}`
}


/** "01:20 - 02:05 (00:45)": start - end in run time, and the duration */
export function get_pull_time_info(pull: Pull) {
    const start = toMMSS(pull.start / 1000)
    const end = toMMSS(pull.end / 1000)
    const duration = toMMSS((pull.end - pull.start) / 1000)
    return `${start} - ${end} (${duration})`
}
