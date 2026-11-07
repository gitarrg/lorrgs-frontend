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
 *     [icon] Wild Growth #4           <- icon, title, title_detail
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
    /** next to the title, eg. a pull's times */
    title_detail?: string
    lines?: TooltipLine[]
}

/** `value` and `label` in two aligned columns, optionally followed by a pull's name (in its colour) */
export type TooltipLine = { value: string, label: string, pull?: { name: string, color: string } }

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


/**
 * a time in tooltip lines: "3s", "2m05s", "15m03s".
 * Seconds are padded once there are minutes, so right-aligned values line up.
 */
export function format_time(seconds: number) {
    const total = Math.round(seconds)
    if (total < 60) { return `${total}s` }
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}m${s.toString().padStart(2, "0")}s`
}


/** name and colour of a pull, for a `TooltipLine` */
export function pull_tag(pull: Pull, index: number) {
    return { name: get_pull_label(pull, index), color: pull.boss ? BOSS_PULL_COLOR : PULL_COLOR }
}


/**
 * Where `t` (run time, seconds) is, as tooltip lines:
 *
 *     14m22s  into Dungeon          (or "into the fight", without pulls)
 *        35s  into Pull #3          (or, between pulls: "after Pull #2" and "before Pull #3")
 *
 * Always the run time: not the time as labelled on the row, which depends on the alignment.
 */
export function get_time_lines(pulls: Pull[] | undefined, t: number): TooltipLine[] {
    if (!pulls?.length) { return [{ value: format_time(t), label: "into the fight" }] }

    const lines: TooltipLine[] = [{ value: format_time(t), label: "into Dungeon" }]

    const found = get_pull_at(pulls, t)
    if (found) {
        lines.push({ value: format_time(t - found.pull.start / 1000), label: "into", pull: pull_tag(found.pull, found.index) })
        return lines
    }

    const before = pulls.findLastIndex(pull => pull.end <= t * 1000)
    const after = pulls.findIndex(pull => pull.start >= t * 1000)
    if (before >= 0) {
        lines.push({ value: format_time(t - pulls[before].end / 1000), label: "after", pull: pull_tag(pulls[before], before) })
    }
    if (after >= 0) {
        lines.push({ value: format_time(pulls[after].start / 1000 - t), label: "before", pull: pull_tag(pulls[after], after) })
    }
    return lines
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
        time_pull: pull_tag(found.pull, found.index),
    }
}
