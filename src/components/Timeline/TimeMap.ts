/*
Maps the time of a Fight ("run time": seconds since the fight/run started)
to its position on the timeline ("display time": seconds from the left edge of the row,
multiplied by the zoom to get pixels) and back.

For a plain fight both are the same. For a dungeon run with selected pulls:
- the row starts at the first selected pull ("crop")
- with `hide_unselected` the time between the selected pulls is cut out,
  and the remaining parts are put next to each other.
- otherwise that time stays, and is listed in `dimmed` to be greyed out.

Labels ("timestamps") show either the run time, or the "pull time":
0:00 at the first selected pull, counting only the time shown (= the display time).

Pure and framework free: everything on the timeline positions itself through this.
*/


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
    /** label times relative to the first selected pull, counting only the time shown */
    pull_time?: boolean
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

    /** display times where time was cut out */
    readonly breaks: number[]

    /** length of the row in display time (s) */
    readonly duration: number

    readonly pull_time: boolean

    /** whether this maps anything else than "display = run time" */
    readonly is_identity: boolean


    constructor(segments: TimeSegment[], dimmed: TimeRange[] = [], pull_time = false) {
        this.segments = segments
        this.dimmed = dimmed
        this.pull_time = pull_time
        this.breaks = segments.slice(1).map(segment => segment.offset)

        const last = segments[segments.length - 1]
        this.duration = last.offset + (last.end - last.start)
        this.is_identity = segments.length == 1 && segments[0].start == 0 && segments[0].offset == 0
    }

    /** "display = run time" for a fight of the given length (s) */
    static identity(duration: number = Infinity) {
        return new TimeMap([{ start: 0, end: duration, offset: 0 }])
    }

    static build({ duration, pulls = [], selected = [], hide_unselected = false, pull_time = false }: TimeMapOptions) {

        const ranges = selected
            .map(i => pulls[i])
            .filter(pull => pull && pull.end > pull.start)
            .map(pull => ({ start: pull.start / 1000, end: pull.end / 1000 }))

        // nothing selected: the whole fight (pull time is the same as run time then)
        if (ranges.length == 0) { return TimeMap.identity(duration) }

        const shown = merge_ranges(ranges)
        const crop: TimeRange = { start: shown[0].start, end: shown[shown.length - 1].end }

        if (hide_unselected) {
            let offset = 0
            const segments = shown.map(range => {
                const segment = { ...range, offset }
                offset += range.end - range.start
                return segment
            })
            return new TimeMap(segments, [], pull_time)
        }

        // dim: the gaps between the selected pulls
        const dimmed: TimeRange[] = []
        for (let i = 1; i < shown.length; i++) {
            dimmed.push({ start: shown[i - 1].end, end: shown[i].start })
        }
        return new TimeMap([{ ...crop, offset: 0 }], dimmed, pull_time)
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
    // Labels
    //

    /** The time to show for a run time (s): itself, or the pull time */
    label(t: number): number {
        return this.pull_time ? this.to_display(t) : t
    }

    /** The time to show at a display time (s) */
    label_at_display(d: number): number {
        return this.pull_time ? d : this.to_run(d)
    }

    /**
     * The shown time in display time, with the label at its start.
     * Within each, the label grows at the same rate as the display time.
     */
    label_ranges(): { start: number, end: number, label: number }[] {
        return this.segments.map(segment => ({
            start: segment.offset,
            end: segment.offset + (segment.end - segment.start),
            label: this.pull_time ? segment.offset : segment.start,
        }))
    }
}


/** Shared by everything in a fight row, so a new map reaches all of them at once. */
export type TimeMapRef = { current: TimeMap }

/** for anything that is not part of a fight row (yet) */
export const IDENTITY_REF: TimeMapRef = { current: TimeMap.identity() }
