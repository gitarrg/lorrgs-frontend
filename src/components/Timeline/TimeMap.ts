/*
Maps the time of a Fight ("run time": seconds since the fight/run started)
to its position on the timeline ("display time": seconds from the left edge of the row,
multiplied by the zoom to get pixels) and back.

For a plain fight both are the same. For a dungeon run with selected pulls:
- the row starts at the first selected pull ("crop")
- with `hide_unselected` the time between the selected pulls is cut out,
  and the remaining parts are put next to each other.
- otherwise that time stays, and is listed in `dimmed` to be greyed out.

Labels ("timestamps") of casts, events and tooltips show (see `TimestampMode`):
- "pull": the time since the fight/run started, whatever is selected or aligned
- "phase": the time into the phase (dungeon run: the pull) the time is in
- "aligned": the time since the aligned phase started in this fight
- "cursor": the time since the time under the pointer

Pixels: display time × zoom, plus "gaps": a fixed number of px before each segment
(see `set_gaps`), for the icons of casts from before it (before the crop, or cut out).

Pure and framework free: everything on the timeline positions itself through this.
*/

import type { Pull } from "../../types/fight"


/** what the labels count from, see the top of this file */
export type TimestampMode = "pull" | "phase" | "aligned" | "cursor"


/** A pull of a dungeon run, as sent by the API (milliseconds since the run started). */
export interface PullData {
    start: number
    end: number
    boss: string | null
}


/** A piece of run time shown without gaps. */
export interface TimeSegment {
    /** run time (s) */
    start: number
    end: number
    /** display time (s) at `start` */
    offset: number
}


/** run time range (s) */
export interface TimeRange {
    start: number
    end: number
}


export interface TimeMapOptions {
    /** length of the fight in seconds */
    duration: number
    pulls?: PullData[]
    /** indices into `pulls`. None: the whole fight */
    selected?: number[]
    /** cut out the time between the selected pulls (instead of dimming it) */
    hide_unselected?: boolean
    /** dimmed: show the whole fight (the unselected time dimmed) instead of cropping it to the selected pulls (phases) */
    show_all?: boolean
    /** whether something is selected at all (in any fight): `selected` empty then means "nothing of it in this fight" */
    selection_active?: boolean
    /** what the labels count from */
    timestamps?: TimestampMode
    /** run time (s) where the aligned phase starts in this fight (for "aligned") */
    align_origin?: number
    /** run time (s) under the pointer in this fight (for "cursor") */
    cursor_origin?: number
}


/** merge overlapping or touching ranges (sorted by start) */
function merge_ranges(ranges: TimeRange[]): TimeRange[] {
    const sorted = [...ranges].sort((a, b) => a.start - b.start)
    const merged: TimeRange[] = []
    sorted.forEach(range => {
        const last = merged[merged.length - 1]
        if (last && range.start <= last.end) {
            last.end = Math.max(last.end, range.end)
        } else {
            merged.push({ ...range })
        }
    })
    return merged
}


export default class TimeMap {

    /** shown pieces of run time, in order. Always at least one. */
    readonly segments: TimeSegment[]

    /** run time ranges within the shown time to grey out */
    readonly dimmed: TimeRange[]

    /** length of the row in display time (s) */
    readonly duration: number

    timestamps: TimestampMode

    /** run time (s) the aligned phase starts at. None: not aligned (or not in this fight): labels show the run time */
    align_origin?: number

    /** run time (s) under the pointer ("cursor" labels count from it). None (pointer not seen yet): labels show the run time */
    cursor_origin?: number

    /** pulls or phases (run time, s) in order: "phase" labels count from the start of the one the time is in */
    phase_ranges: TimeRange[] = []

    /** whether this maps anything else than "display = run time" */
    readonly is_identity: boolean

    /** px before each segment (index: segment). Set by the fight row once its casts are placed. */
    gaps: number[] = []


    constructor(segments: TimeSegment[], dimmed: TimeRange[] = [], timestamps: TimestampMode = "pull") {
        this.segments = segments
        this.dimmed = dimmed
        this.timestamps = timestamps

        const last = segments[segments.length - 1]
        this.duration = last.offset + (last.end - last.start)
        this.is_identity = segments.length == 1 && segments[0].start == 0 && segments[0].offset == 0
    }

    /** "display = run time" for a fight of the given length (s) */
    static identity(duration: number = Infinity) {
        return new TimeMap([{ start: 0, end: duration, offset: 0 }])
    }

    static build({ duration, pulls = [], selected = [], hide_unselected = false, show_all = false, timestamps = "pull", selection_active = false, align_origin, cursor_origin }: TimeMapOptions) {
        const map = TimeMap.build_map({ duration, pulls, selected, hide_unselected, show_all, timestamps, selection_active })
        map.timestamps = timestamps
        map.align_origin = align_origin
        map.cursor_origin = cursor_origin
        map.phase_ranges = pulls.map(pull => ({ start: pull.start / 1000, end: pull.end / 1000 }))
        return map
    }

    private static build_map({ duration, pulls = [], selected = [], hide_unselected = false, show_all = false, timestamps = "pull", selection_active = false }: TimeMapOptions) {

        const ranges = selected
            .map(i => pulls[i])
            .filter(pull => pull && pull.end > pull.start)
            .map(pull => ({ start: pull.start / 1000, end: pull.end / 1000 }))

        // nothing selected anywhere: the whole fight. (A selection that matches nothing in this fight, eg. a phase it doesn't have,
        // is no exception: all of its time is unselected, so it is dimmed or cut out like any other.)
        if (ranges.length == 0 && !selection_active) { return TimeMap.identity(duration) }

        const shown = merge_ranges(ranges)
        const crop: TimeRange = { start: shown[0]?.start ?? 0, end: shown[shown.length - 1]?.end ?? 0 }

        if (hide_unselected) {
            let offset = 0
            const segments = shown.map(range => {
                const segment = { ...range, offset }
                offset += range.end - range.start
                return segment
            })
            return new TimeMap(segments.length ? segments : [{ start: 0, end: 0, offset: 0 }], [], timestamps)  // (cut out: an empty row)
        }

        // dim: the gaps between the selected pulls
        const dimmed: TimeRange[] = []
        for (let i = 1; i < shown.length; i++) {
            dimmed.push({ start: shown[i - 1].end, end: shown[i].start })
        }
        if (show_all) {
            const end = Math.max(crop.end, duration, ...pulls.map(pull => pull.end / 1000))
            const all: TimeRange[] = []
            let t = 0
            shown.forEach(range => {
                if (range.start > t) { all.push({ start: t, end: range.start }) }
                t = range.end
            })
            if (end > t) { all.push({ start: t, end }) }
            return new TimeMap([{ start: 0, end, offset: 0 }], all, timestamps)
        }
        return new TimeMap([{ ...crop, offset: 0 }], dimmed, timestamps)
    }

    ////////////////////////////////////////////////////////////////////////////
    // Run time -> display time
    //

    /**
     * Display time (s) of a run time (s).
     * Continuous and never decreasing: time that was cut out maps to where it was cut,
     * and time before/after the shown part continues past the edges of the row.
     */
    to_display(t: number): number {
        const segments = this.segments
        const first = segments[0]
        if (t < first.start) { return first.offset + (t - first.start) }

        for (const segment of segments) {
            if (t < segment.start) { return segment.offset }  // cut out: at the cut
            if (t <= segment.end) { return segment.offset + (t - segment.start) }
        }

        const last = segments[segments.length - 1]
        return last.offset + (t - last.start)
    }

    /** Display length (s) of the run time from `t` to `t + duration` (without the parts cut out). */
    display_length(t: number, duration: number): number {
        return this.to_display(t + duration) - this.to_display(t)
    }

    /** false if the run time was cut out (between two shown segments) */
    is_shown(t: number): boolean {
        const segments = this.segments
        if (t < segments[0].start || t > segments[segments.length - 1].end) { return true }  // outside: clipped by the row
        return segments.some(segment => t >= segment.start && t <= segment.end)
    }

    /** whether the run time is shown on the row: not cut out, and between its start and end */
    is_in_row(t: number): boolean {
        const d = this.to_display(t)
        return d >= 0 && d <= this.duration && this.is_shown(t)
    }

    /**
     * First run time in `[start, end)` that is shown on the row, or null if none is.
     * For something that starts at `start` and lasts until `end` (eg. a cooldown):
     * `start` itself if shown (even if `end <= start`), else where it comes into view (the row's start, or the start of the segment after a cut).
     */
    first_shown(start: number, end: number): number | null {
        for (const segment of this.segments) {
            if (start > segment.end) { continue }
            const t = Math.max(start, segment.start)
            return (t == start || t < end) ? t : null
        }
        return null
    }

    /** whether the run time is greyed out */
    is_dimmed(t: number): boolean {
        return this.dimmed.some(range => t > range.start && t < range.end)
    }

    ////////////////////////////////////////////////////////////////////////////
    // Display time -> run time
    //

    /** Run time (s) at a display time (s). At a cut, the end of the segment before it. */
    to_run(d: number): number {
        const segments = this.segments
        const first = segments[0]
        if (d < first.offset) { return first.start + (d - first.offset) }

        for (const segment of segments) {
            const length = segment.end - segment.start
            if (d <= segment.offset + length) { return segment.start + (d - segment.offset) }
        }

        const last = segments[segments.length - 1]
        return last.start + (d - last.offset)
    }

    ////////////////////////////////////////////////////////////////////////////
    // Pixels (display time × zoom, with the gaps)
    //

    /** @returns false if the gaps didn't change */
    set_gaps(gaps: number[]): boolean {
        const same = gaps.length == this.gaps.length && gaps.every((gap, i) => gap == this.gaps[i])
        if (same) { return false }
        this.gaps = gaps
        return true
    }

    /** px before segment `i` */
    gap(i: number): number {
        return this.gaps[i] || 0
    }

    /** index of the segment that starts at run time `t`, or contains it (the last one before it, if cut out) */
    segment_index(t: number): number {
        let index = 0
        this.segments.forEach((segment, i) => { if (t >= segment.start) { index = i } })
        return index
    }

    /** px from the row's left edge to each segment's start and end */
    segment_xs(scale: number): { x0: number, x1: number }[] {
        let gaps = 0
        return this.segments.map((segment, i) => {
            gaps += this.gap(i)
            const x0 = segment.offset * scale + gaps
            return { x0, x1: x0 + (segment.end - segment.start) * scale }
        })
    }

    /** px of a run time (s). Time cut out: at the cut (before the next gap). Before the row: left of its first gap. */
    to_x(t: number, scale: number): number {
        let gaps = this.gap(0)
        for (let i = 1; i < this.segments.length; i++) {
            if (t >= this.segments[i].start) { gaps += this.gap(i) }
        }
        return this.to_display(t) * scale + gaps
    }

    /** run time (s) at px `x`. In a gap: where its segment starts */
    run_at_x(x: number, scale: number): number {
        const xs = this.segment_xs(scale)
        for (let i = 0; i < xs.length; i++) {
            const segment = this.segments[i]
            if (x < xs[i].x0) { return i == 0 ? segment.start + (x - xs[i].x0) / scale : segment.start }
            if (x <= xs[i].x1) { return segment.start + (x - xs[i].x0) / scale }
        }
        const last = this.segments.length - 1
        return this.segments[last].end + (x - xs[last].x1) / scale
    }

    /** width of the row in px */
    width(scale: number): number {
        return this.duration * scale + this.gaps.reduce((a, b) => a + b, 0)
    }

    ////////////////////////////////////////////////////////////////////////////
    // Labels
    //

    /** The time to show for a run time (s), see `TimestampMode` */
    label(t: number): number {
        if (this.timestamps == "cursor") { return t - (this.cursor_origin ?? 0) }
        if (this.timestamps == "aligned") { return t - (this.align_origin ?? 0) }
        if (this.timestamps == "phase") {
            // between pulls (dungeon runs): the run time
            const range = this.phase_ranges.find(range => t >= range.start && t <= range.end)
            return range ? t - range.start : t
        }
        return t
    }

    /** The time to show at a display time (s) */
    label_at_display(d: number): number {
        return this.label(this.to_run(d))
    }
}


/**
 * Shared by everything in a fight row, so a new map reaches all of them at once.
 * `pulls`: the pulls of a dungeon run (for tooltips)
 */
export type TimeMapRef = { current: TimeMap, pulls?: Pull[] }

/** for anything that is not part of a fight row (yet) */
export const IDENTITY_REF: TimeMapRef = { current: TimeMap.identity() }
