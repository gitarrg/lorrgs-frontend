import { LINE_HEIGHT } from "../../constants";
import { toMMSS } from "../../utils";
import * as constants from "./constants"
import Konva from "konva"
import MouseCrosshair from "./Overlays/MouseCrosshair";
import Stage from "./Stage";
import TimelineMarker from "./Overlays/TimelineMarker";


/**
 * Available ruler resolutions, from fine to coarse.
 * `label`: seconds between timestamps, `tick`: seconds between ticks.
 * `label` must be a multiple of `tick`.
 */
const LEVELS = [
    { label: 1, tick: 0.5 },
    { label: 5, tick: 1 },
    { label: 15, tick: 5 },
    { label: 30, tick: 10 },
    { label: 60, tick: 15 },
    { label: 120, tick: 30 },
    { label: 300, tick: 60 },
    { label: 600, tick: 120 },
]

/** Minimum distance between two timestamps in px. At the default zoom (4px/s) this results in 30s steps (120px). */
const MIN_LABEL_SPACING = 80


export default class Ruler extends Konva.Group {

    private level = LEVELS[3]
    private color = "white";

    // time in seconds
    duration: number

    private stage: Stage
    private markers: TimelineMarker[]
    private bbox: Konva.Rect
    private mouse_crosshair: MouseCrosshair
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
        // MouseCrosshair
        this.mouse_crosshair = new MouseCrosshair()
        this.bbox.on("mouseover", () => { this.mouse_crosshair.visible(true) })
        this.bbox.on("mouseout", () => { this.mouse_crosshair.visible(false) })
        this.bbox.on("mousemove", () => { this.handle_mousemove() })
        stage.overlay_layer.add(this.mouse_crosshair)

        //////////////////////////
        //
        this.bbox.on("dblclick dbltap", () => this.add_marker())
    }

    /** Pick the finest level whose timestamps are at least `MIN_LABEL_SPACING` apart. */
    private static level_for_scale(scale_x: number) {
        return LEVELS.find(level => level.label * scale_x >= MIN_LABEL_SPACING) ?? LEVELS[LEVELS.length - 1]
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
        this.level = Ruler.level_for_scale(this.stage.scale_x)
        this.create_ticks()
    }

    ////////////////////////////////////////////////////////////////////////////
    // Events
    //
    private handle_zoom_change(scale_x: number) {

        // switch to a finer/coarser resolution if needed
        const level = Ruler.level_for_scale(scale_x)
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

        this.mouse_crosshair.handle_event(event_name, payload)
        this.markers.forEach(marker => marker.handle_event(event_name, payload))
    }

    ////////////////////////////////////////////////////////////////////////////
    // Interaction
    //

    private handle_mousemove() {
        this.mouse_crosshair.handle_mousemove()
        this.stage.overlay_layer.batchDraw()
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
        this.stage.overlay_layer.add(marker)
    }
}
