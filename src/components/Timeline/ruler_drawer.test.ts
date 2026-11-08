import { describe, expect, it } from "vitest"
import RulerDrawer, { get_ticks, type RulerContext, type RulerRun } from "./ruler_drawer"
import { LEVELS } from "./ruler_levels"


/** records the calls, and the attributes at the time of each `fillText` */
function fake_context() {
    const lines: { x: number, y0: number, y1: number }[] = []
    const texts: { text: string, x: number, y: number, fillStyle: any, font: any }[] = []
    const attrs: Record<string, any> = {}
    let from = { x: 0, y: 0 }
    const context: RulerContext = {
        setAttr: (key, value) => { attrs[key] = value },
        beginPath: () => { },
        moveTo: (x, y) => { from = { x, y } },
        lineTo: (x, y) => { lines.push({ x, y0: from.y, y1: y }) },
        stroke: () => { },
        fillText: (text, x, y) => { texts.push({ text, x, y, fillStyle: attrs.fillStyle, font: attrs.font }) },
    }
    return { context, lines, texts, attrs }
}

const run = (from: number, to: number, x: (t: number) => number): RulerRun => ({ from, to, x })

const LEVEL_5 = { label: 5, tick: 1 }
const LEVEL_HALF = { label: 1, tick: 0.5 }


describe("get_ticks", () => {
    it("has a tick on every multiple of the tick length, in range", () => {
        expect(get_ticks(0, 3, LEVEL_5).map(t => t.t)).toEqual([0, 1, 2, 3])
        expect(get_ticks(0.5, 3.5, LEVEL_5).map(t => t.t)).toEqual([1, 2, 3])
    })

    it("makes every `label / tick`-th tick big", () => {
        const ticks = get_ticks(0, 10, LEVEL_5)
        expect(ticks.filter(t => t.big).map(t => t.t)).toEqual([0, 5, 10])
    })

    it("goes before 0 too, with 0 and its multiples big", () => {
        const ticks = get_ticks(-10, 0, LEVEL_5)
        expect(ticks[0]).toMatchObject({ t: -10, big: true })
        expect(ticks.filter(t => t.big).map(t => t.t)).toEqual([-10, -5, 0])
    })

    it("has no float drift with sub-second ticks", () => {
        const ticks = get_ticks(0, 100, LEVEL_HALF)
        expect(ticks).toHaveLength(201)
        expect(ticks[199].t).toBe(99.5)
        expect(ticks.filter(t => t.big)).toHaveLength(101)
    })

    it("includes ranges ending just short of a tick, because of float errors", () => {
        expect(get_ticks(0, 0.1 + 0.2 + 0.7, LEVEL_5).map(t => t.t)).toEqual([0, 1])
        expect(get_ticks(0.3 - 0.1 - 0.2 + 1, 2, LEVEL_5).map(t => t.t)).toEqual([1, 2])
    })

    it("is empty when no tick is in range", () => {
        expect(get_ticks(1.2, 1.8, LEVEL_5)).toEqual([])
        expect(get_ticks(3, 2, LEVEL_5)).toEqual([])
    })
})


describe("RulerDrawer.level", () => {
    it("picks the finest level whose labels are far enough apart", () => {
        const drawer = new RulerDrawer()
        expect(drawer.level(100)).toBe(LEVELS[0])  // 1s * 100px = 100px >= 80
        expect(drawer.level(4)).toBe(LEVELS[3])  // 30s * 4px = 120px
    })

    it("uses the coarsest level when zoomed out further", () => {
        expect(new RulerDrawer().level(0.001)).toBe(LEVELS[LEVELS.length - 1])
    })

    it("takes its own levels and spacing", () => {
        const levels = [{ label: 10, tick: 5 }, { label: 20, tick: 10 }]
        const drawer = new RulerDrawer({ levels, min_label_spacing: 100 })
        expect(drawer.level(10)).toBe(levels[0])
        expect(drawer.level(6)).toBe(levels[1])
    })
})


describe("RulerDrawer.draw", () => {
    // 10 px/s: labels every 15s (see LEVELS), ticks every 5s
    const SCALE = 10
    const drawer = new RulerDrawer({ height: 20, big_tick: 8, small_tick: 3, text_y: 9 })

    it("draws ticks at the run's x, on a half pixel, big ones taller", () => {
        const { context, lines } = fake_context()
        drawer.draw(context, [run(0, 15, t => t * SCALE)], SCALE)
        expect(lines).toEqual([
            { x: 0.5, y0: 12, y1: 20 },
            { x: 50.5, y0: 17, y1: 20 },
            { x: 100.5, y0: 17, y1: 20 },
            { x: 150.5, y0: 12, y1: 20 },
        ])
    })

    it("labels the big ticks as mm:ss, starting at the tick", () => {
        const { context, texts } = fake_context()
        drawer.draw(context, [run(0, 30, t => t * SCALE)], SCALE)
        expect(texts).toEqual([
            expect.objectContaining({ text: "00:00", x: 0, y: 9 }),
            expect.objectContaining({ text: "00:15", x: 150, y: 9 }),
            expect.objectContaining({ text: "00:30", x: 300, y: 9 }),
        ])
    })

    it("draws labels after the ticks, with the style's colour and font", () => {
        const { context, texts, attrs } = fake_context()
        new RulerDrawer({ color: "red", font: "10px Foo" }).draw(context, [run(0, 15, t => t * SCALE)], SCALE)
        expect(attrs.strokeStyle).toBe("red")
        expect(texts[0]).toMatchObject({ fillStyle: "red", font: "10px Foo" })
    })

    it("counts negative times (before the origin)", () => {
        const { context, texts } = fake_context()
        drawer.draw(context, [run(-15, 0, t => t * SCALE)], SCALE)
        expect(texts.map(t => t.text)).toEqual(["-00:15", "00:00"])
    })

    it("draws every run, each with its own x", () => {
        const { context, lines } = fake_context()
        drawer.draw(context, [run(0, 5, t => t * SCALE), run(0, 5, t => 500 + t * SCALE)], SCALE)
        expect(lines.map(l => l.x)).toEqual([0.5, 50.5, 500.5, 550.5])
    })

    it("skips labels closer than `min_text_spacing` to the one before", () => {
        // two runs next to each other (a cut): the second one's 0:00 is 20px after the first one's last label
        const { context, texts, lines } = fake_context()
        drawer.draw(context, [run(0, 15, t => t * SCALE), run(0, 15, t => 170 + t * SCALE)], SCALE)
        expect(texts.map(t => [t.text, t.x])).toEqual([["00:00", 0], ["00:15", 150], ["00:15", 320]])  // (the 00:00 at 170 is skipped)
        expect(lines).toHaveLength(8)  // (but not its tick)
    })

    it("lets a label restyle itself, only for that label", () => {
        const { context, texts } = fake_context()
        drawer.draw(context, [run(0, 30, t => t * SCALE)], SCALE, t => t == 0 ? { text: "Pull", color: "cyan", font: "bold 14px Lato" } : toText(t))
        expect(texts.map(t => [t.text, t.fillStyle, t.font])).toEqual([
            ["Pull", "cyan", "bold 14px Lato"],
            ["15", "white", "14px Lato"],
            ["30", "white", "14px Lato"],
        ])
    })

    it("draws nothing for no runs or empty runs", () => {
        const { context, lines, texts } = fake_context()
        drawer.draw(context, [], SCALE)
        drawer.draw(context, [run(1, 4, t => t * SCALE)], SCALE)  // between ticks
        expect(lines).toEqual([])
        expect(texts).toEqual([])
    })
})

const toText = (t: number) => String(t)
