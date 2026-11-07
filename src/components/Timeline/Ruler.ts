import { LINE_HEIGHT } from "../../constants";
import { toMMSS } from "../../utils";
import * as constants from "./constants"
import Konva from "konva"
import Stage from "./Stage";
import TimelineMarker from "./Overlays/TimelineMarker";
import { LEVELS, level_for_scale } from "./ruler_levels";
import { hide_tooltip, show_tooltip, type TooltipInfo } from "./tooltip";



export default class Ruler extends Konva.Group {

    private level = LEVELS[3]
    private color = "white";

    // time in seconds
    duration: number

    private stage: Stage
    private markers: TimelineMarker[]
    private bbox: Konva.Rect
    private bottom_line?: Konva.Line
    private zero_timestamp?: Konva.Text


    constructor(stage: Stage, config: any = {}) {
        // config.listening = false
        super(config)
        this.transformsEnabled("position")
        this.name("Ruler")

        this.height(LINE_HEIGHT) // set a fixed height for layout purposes

        this.stage = stage
        this.duration = 0;
        this.markers = []

        //////////////////////////
        // bbox used to catch mouse events
        this.bbox = new Konva.Rect({
            height: constants.LINE_HEIGHT,
            width: 200, // fixed in handle-zoom
            transformsEnabled: "none",
        })
        this.stage.overlay_layer.add(this.bbox)

        //////////////////////////
        //
        this.bbox.on("dblclick dbltap", () => this.add_marker())
        this.bbox.on("mousemove", () => this.handle_mousemove())
        this.bbox.on("mouseout", () => hide_tooltip())
    }

    /** Show or hide the ruler (eg. when every shown fight has its own pull row). Keeps its height for the layout. */
    set_shown(state: boolean) {
        this.visible(state)
        this.bbox.visible(state)
    }

    private create_ticks() {

        // reset
        this.destroyChildren()
        this.zero_timestamp = undefined

        if (this.duration <= 0) { return; }

        this.bottom_line = new Konva.Line({
            name: "bottom_line",
            points: [], // applied in handle_zoom
            stroke: "black",
            strokeWidth: 1,
            transformsEnabled: "none",
        })
        this.add(this.bottom_line)

        /////////////////////////////////////
        // create ticks
        //
        const { label, tick } = this.level
        const ticks_per_label = Math.round(label / tick)

        // to allow phase-anchors we simply mirror the ruler on both sides.
        // not ideal but works for now
        // (iterate over integer indices to avoid float drift with sub-second ticks)
        const first = Math.floor(-this.duration / label) * ticks_per_label
        const last = Math.ceil(this.duration / tick)

        for (let i = first; i < last; i++) {
            const t = i * tick
            const big = i % ticks_per_label == 0
            const h = big ? 10 : 5

            this.add(new Konva.Line({
                name: "tick",
                points: [0.5, constants.LINE_HEIGHT - h, 0.5, constants.LINE_HEIGHT],
                stroke: this.color,
                strokeWidth: 1,
                transformsEnabled: "position",
                ts: t,  // custom: current timestamp
            }))

            if (big) {
                let text = new Konva.Text({
                    text: toMMSS(t),
                    name: "timestamp",
                    y: -10,
                    fontSize: 14,
                    height: constants.LINE_HEIGHT,
                    verticalAlign: 'bottom',
                    align: "center",
                    fontFamily: "Lato",
                    fill: this.color,
                    transformsEnabled: "position",
                    ts: t,  // custom: current timestamp
                })

                if (t == 0) {
                    this.zero_timestamp = text
                }
                this.add(text)
            } // if big
        } // for i

        this.update_zero_timestamp()
    }

    ///////////////////////////////////////////////////////////
    //

    update_duration(duration: number) {
        this.duration = duration;
        this.level = level_for_scale(this.stage.scale_x)
        this.create_ticks()
    }

    ////////////////////////////////////////////////////////////////////////////
    // Events
    //
    private handle_zoom_change(scale_x: number) {

        // switch to a finer/coarser resolution if needed
        const level = level_for_scale(scale_x)
        if (level !== this.level) {
            this.level = level
            this.create_ticks()
        }

        // Offset the entire ruler based on anchor
        const { ts } = this.stage.get_anchor()
        this.x(ts * scale_x)


        // update ticks
        this.find(".tick").forEach((tick, i) => {
            // tick.x(this.tick_distance * i * scale_x);
            tick.x(tick.getAttr("ts") * scale_x)
        })

        // update timestamps
        this.find(".timestamp").forEach((timestamp, i) => {
            // let x = this.timestamp_distance * i * scale_x
            // x += i == 0 ? 0 : -18;
            timestamp.x(timestamp.getAttr("ts") * scale_x)
        })

        this.bottom_line && this.bottom_line.points([this.duration * scale_x * -1, constants.LINE_HEIGHT + 0.5, this.duration * scale_x, constants.LINE_HEIGHT + 0.5])
        this.bbox.width(this.duration * scale_x)
        this.duration && this.cache()
    }

    private handle_anchor_changed({ ts }: { ts: number, name: string }) {

        // update on anchor change.
        // will also update on zoom change in `handle_zoom_change`
        this.x(ts * this.stage.scale_x)
        this.update_zero_timestamp()
        this.duration && this.cache()
    }

    /** Show the anchor name on the 0:00 timestamp. */
    private update_zero_timestamp() {
        if (!this.zero_timestamp) { return }

        let { ts, name } = this.stage.get_anchor()
        name = name || toMMSS(ts)

        let color = "#0FF"  // todo: config
        let fontStyle = "bold"

        if (ts == 0) {
            name = toMMSS(ts)
            color = this.color
            fontStyle = ""
        }

        this.zero_timestamp.text(name)
        this.zero_timestamp.fill(color)
        this.zero_timestamp.fontStyle(fontStyle)
    }


    handle_event(event_name: string, payload: any) {
        if (event_name === constants.EVENT_ZOOM_CHANGE) { this.handle_zoom_change(payload) }
        if (event_name === constants.EVENT_ANCHOR_CHANGED) { this.handle_anchor_changed(payload) }

        this.markers.forEach(marker => marker.handle_event(event_name, payload))
    }

    ////////////////////////////////////////////////////////////////////////////
    // Interaction
    //

    /** tooltip with the time under the pointer (relative to the anchor, like the timestamps) */
    private handle_mousemove() {
        const pointer = this.stage.getPointerPosition()
        if (!pointer) { return }

        const { ts, name } = this.stage.get_anchor()
        const time = (pointer.x - this.stage.x()) / this.stage.scale_x - ts
        const info: TooltipInfo = { time: toMMSS(time) }
        if (ts) { info.time_detail = `from ${name || toMMSS(ts)}` }

        const container = this.stage.container().getBoundingClientRect()
        show_tooltip(info, { x: container.x + pointer.x, y: container.y + this.bbox.getAbsolutePosition().y })
    }

    add_marker() {

        let pointer = this.stage.getPointerPosition();
        if (!pointer) { return }
        let x = pointer.x - this.stage.x()
        let time = x / this.stage.scale_x

        let marker = new TimelineMarker()
        marker.time = time
        marker.x(x)
        marker.set_height(this.stage.height())


        this.markers.push(marker)
        this.stage.marker_layer.add(marker)
    }

    remove_marker(marker: TimelineMarker) {
        this.markers = this.markers.filter(m => m !== marker)
        marker.destroy()
        this.stage.marker_layer.batchDraw()
    }
}
