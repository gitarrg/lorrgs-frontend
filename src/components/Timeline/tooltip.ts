/* What the timeline's tooltip shows (see `TimelineTooltip`), and helpers to fill it. */
import store from "../../store/store"
import * as constants from "./constants"
import { toMMSS } from "../../utils"
import { BOSS_PULL_COLOR, PULL_COLOR, get_pull_label } from "../../pulls"
import type { Pull } from "../../types/fight"
import type { TimeMapRef } from "./TimeMap"


/**
 * A structured tooltip:
 *
 *     [icon] Wild Growth #4           <- icon, title
 *     02:22  35s into Pull #3         <- time, time_detail, time_pull (in the pull's colour)
 *     45s    since the last cast      <- lines
 */
export type TooltipInfo = {
    time?: string
    time_detail?: string
    time_pull?: { name: string, color: string }
    icon?: string
    title?: string
    title_color?: string
    lines?: { value: string, label: string }[]
}

export type TooltipContent = string | TooltipInfo


/** Show `content` above `position` (page coords). Empty content hides the tooltip. */
export function show_tooltip(content: TooltipContent, position: { x: number, y: number }) {
    store.dispatch({ type: constants.EVENT_SHOW_TOOLTIP, payload: { content, position } })
}

export function hide_tooltip() {
    show_tooltip("", { x: 0, y: 0 })
}


/** a length of time: "45s", "1m 05s" */
export function format_duration(seconds: number) {
    const total = Math.round(seconds)
    if (total < 60) { return `${total}s` }
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}m ${s.toString().padStart(2, "0")}s`
}


/** the pull running at `t` (run time, seconds) */
export function get_pull_at(pulls: Pull[] | undefined, t: number): { pull: Pull, index: number } | null {
    const index = (pulls || []).findIndex(pull => t * 1000 >= pull.start && t * 1000 <= pull.end)
    return index >= 0 ? { pull: pulls![index], index } : null
}


/** The time line of a tooltip at `t` (run time, seconds): as labelled on the row, and how far into its pull. */
export function get_time_info(time_ref: TimeMapRef, t: number): Pick<TooltipInfo, "time" | "time_detail" | "time_pull"> {
    const time = toMMSS(time_ref.current.label(t))

    const pulls = time_ref.pulls
    if (!pulls?.length) { return { time } }

    const found = get_pull_at(pulls, t)
    if (!found) { return { time, time_detail: "between pulls" } }

    const into = t - found.pull.start / 1000
    return {
        time,
        time_detail: `${format_duration(into)} into`,
        time_pull: {
            name: get_pull_label(found.pull, found.index),
            color: found.pull.boss ? BOSS_PULL_COLOR : PULL_COLOR,
        },
    }
}
