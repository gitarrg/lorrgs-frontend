import { LINE_HEIGHT } from "../../constants";
import { toMMSS } from "../../utils";
import * as constants from "./constants"
import Konva from "konva"
import MouseCrosshair from "./Overlays/MouseCrosshair";
import Stage from "./Stage";
import TimelineMarker from "./Overlays/TimelineMarker";


export default class Ruler extends Konva.Group {

    private tick_distance = 10; // seconds
    private timestamp_distance = 30;
    private color = "white";

    // time in seconds
    duration: number

    // anchor offset in seconds
    offset: number



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

    private create_ticks() {

        // reset
        this.destroyChildren()

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

        // to allow phase-anchors we simply mirror the ruler on both sides.
        // not ideal but works for now
        let start = -this.duration + (this.duration % this.timestamp_distance)
        for (var t = start; t < this.duration; t += this.tick_distance) {

            let big = (t % this.timestamp_distance) == 0;
            let h = big ? 10 : 5

            let tick = new Konva.Line({
                name: "tick",
                points: [0.5, constants.LINE_HEIGHT - h, 0.5, constants.LINE_HEIGHT],
                stroke: this.color,
                strokeWidth: 1,
                transformsEnabled: "position",
            })
            tick.ts = t

            this.add(tick)

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
                })
                text.ts = t

                if (t == 0) {
                    this.zero_timestamp = text
                }

                text.on("transform", () => {
                    text.scaleX(1.0)
                })
                this.add(text)
            } // if big
        } // for t
    }

    ///////////////////////////////////////////////////////////
    //

    update_duration(duration: number) {
        this.duration = duration;
        this.create_ticks()
    }

    ////////////////////////////////////////////////////////////////////////////
    // Events
    //
    private handle_zoom_change(scale_x: number) {

        // Offset the entire ruler based on anchor
        const { ts } = this.stage.get_anchor()
        this.x(ts * scale_x)


        // update ticks
        this.find(".tick").forEach((tick, i) => {
            // tick.x(this.tick_distance * i * scale_x);
            tick.x(tick.ts * scale_x)
        })

        // update timestamps
        this.find(".timestamp").forEach((timestamp, i) => {
            // let x = this.timestamp_distance * i * scale_x
            // x += i == 0 ? 0 : -18;
            timestamp.x(timestamp.ts * scale_x)
        })

        this.bottom_line && this.bottom_line.points([this.duration * scale_x * -1, constants.LINE_HEIGHT + 0.5, this.duration * scale_x, constants.LINE_HEIGHT + 0.5])
        this.bbox.width(this.duration * scale_x)
        this.duration && this.cache()
    }

    private handle_anchor_changed({ ts, name }: { ts: number, name: string }) {

        // update on anchor change.
        // will also update on zoom change in `handle_zoom_change`
        this.x(ts * this.stage.scale_x)

        // Update the 0:00 timestamp
        name = name || toMMSS(ts)

        let color = "#0FF"  // todo: config
        let fontStyle = "bold"

        if (ts == 0) {
            name = toMMSS(ts)
            color = this.color
            fontStyle = ""
        }

        this.zero_timestamp?.text(name)
        this.zero_timestamp?.fill(color)
        this.zero_timestamp?.fontStyle(fontStyle)
        this.cache()
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
