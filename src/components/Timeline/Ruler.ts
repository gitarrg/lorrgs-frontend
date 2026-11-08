import { LINE_HEIGHT } from "../../constants";
import { toMMSS } from "../../utils";
import * as constants from "./constants"
import Konva from "konva"
import type { Context } from "konva/lib/Context"
import Stage from "./Stage";
import TimelineMarker from "./Overlays/TimelineMarker";
import RulerDrawer from "./ruler_drawer";
import { clear_phase_selection } from "./phase_selection";
import { hide_tooltip, show_tooltip, type TooltipInfo } from "./tooltip";



/** the timestamp of the anchor (0:00 of the ruler): same as the active phase marker */
const ANCHOR_COLOR = "#0FF"  // todo: config
const FONT = "14px Lato"


export default class Ruler extends Konva.Group {

    private color = "white";
    private drawer = new RulerDrawer({ height: LINE_HEIGHT, color: this.color, font: FONT })

    // time in seconds
    duration: number

    private stage: Stage
    private markers: TimelineMarker[]
    private bbox: Konva.Rect
    /** the ticks and timestamps (and the line under them) */
    private shape: Konva.Shape


    constructor(stage: Stage, config: any = {}) {
        // config.listening = false
        super(config)
        this.transformsEnabled("position")
        this.name("Ruler")

        this.height(LINE_HEIGHT) // set a fixed height for layout purposes

        this.stage = stage
        this.duration = 0;
        this.markers = []

        // one shape for all ticks and timestamps: positioned by the anchor (see `handle_anchor_changed`), so it covers both sides of 0
        this.shape = new Konva.Shape({
            name: "ticks",
            listening: false,
            transformsEnabled: "position",
            perfectDrawEnabled: false,
            sceneFunc: (context) => this.draw_ticks(context),
        })
        this.add(this.shape)

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
        this.bbox.on("contextmenu", (event) => { event.evt.preventDefault(); clear_phase_selection() })
    }

    /** Show or hide the ruler (eg. when every shown fight has its own pull row). Keeps its height for the layout. */
    set_shown(state: boolean) {
        this.visible(state)
        this.bbox.visible(state)
    }

    private draw_ticks(context: Context) {
        if (this.duration <= 0) { return }
        const scale = this.stage.scale_x
        const { ts, name } = this.stage.get_anchor()

        // to allow phase-anchors we simply mirror the ruler on both sides.
        // not ideal but works for now
        this.drawer.draw(context, [{ from: -this.duration, to: this.duration, x: t => t * scale }], scale, t => {
            // the anchor name on the 0:00 timestamp
            if (t != 0 || ts == 0) { return toMMSS(t) }
            return { text: name || toMMSS(ts), color: ANCHOR_COLOR, font: `bold ${FONT}` }
        })

        context.setAttr("strokeStyle", "black")
        context.beginPath()
        context.moveTo(-this.duration * scale, constants.LINE_HEIGHT + 0.5)
        context.lineTo(this.duration * scale, constants.LINE_HEIGHT + 0.5)
        context.stroke()
    }

    ///////////////////////////////////////////////////////////
    //

    update_duration(duration: number) {
        this.duration = duration;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Events
    //
    private handle_zoom_change(scale_x: number) {
        // Offset the entire ruler based on anchor
        const { ts } = this.stage.get_anchor()
        this.x(ts * scale_x)
        this.bbox.width(this.duration * scale_x)
    }

    private handle_anchor_changed({ ts }: { ts: number, name: string }) {
        this.x(ts * this.stage.scale_x)
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
