// PROTOTYPE (throwaway): 3 variants of the keystone info for a dungeon run, switch with ?variant=A|B|C (or ← →).
// A: hover card on the icon. B: hover card as a "scoreboard" + level badge in the bar. C: info inside the pull selector popover + inline line.
import { useEffect, useState, type ReactNode } from "react"
import { useSearchParams } from "react-router"
import type Fight from "../../../types/fight"
import type Dungeon from "../../../types/dungeon"

const VARIANTS = ["A", "B", "C"] as const
const NAMES = { A: "Hover card (rows)", B: "Hover card (scoreboard) + badge", C: "In pull selector + inline" }

export function useVariant() {
    const [params, set_params] = useSearchParams()
    const v = (params.get("variant") ?? "A").toUpperCase() as typeof VARIANTS[number]
    return [VARIANTS.includes(v) ? v : "A", (n: string) => set_params(p => { p.set("variant", n); return p }, { replace: true })] as const
}

export function PrototypeSwitcher() {
    const [variant, set_variant] = useVariant()
    useEffect(() => {
        const on_key = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement
            if (/INPUT|TEXTAREA/.test(t.tagName) || t.isContentEditable) { return }
            const i = VARIANTS.indexOf(variant)
            if (e.key == "ArrowRight") { set_variant(VARIANTS[(i + 1) % 3]) }
            if (e.key == "ArrowLeft") { set_variant(VARIANTS[(i + 2) % 3]) }
        }
        window.addEventListener("keydown", on_key)
        return () => window.removeEventListener("keydown", on_key)
    })
    if (import.meta.env.PROD) { return null }
    const i = VARIANTS.indexOf(variant)
    const btn = { background: "none", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer" }
    return (
        <div style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", gap: 12, alignItems: "center", padding: "6px 14px", borderRadius: 999, background: "#7c3aed", color: "white", boxShadow: "0 4px 16px rgba(0,0,0,.6)", fontSize: ".9rem" }}>
            <button style={btn} onClick={() => set_variant(VARIANTS[(i + 2) % 3])}>←</button>
            <span>{variant} ({NAMES[variant]})</span>
            <button style={btn} onClick={() => set_variant(VARIANTS[(i + 1) % 3])}>→</button>
        </div>
    )
}

////////////////////////////////////////////////////////////////////////////////

function mmss(sec: number) {
    const t = Math.round(Math.abs(sec))
    return `${Math.floor(t / 60)}m${String(t % 60).padStart(2, "0")}s`
}

/** real data if the backend sent it, else mock (so old runs still show something in the prototype) */
function get_info(fight: Fight, dungeon: Dungeon | null) {
    const mock = !fight.keystone_level
    const level = fight.keystone_level || 12
    const time = (fight.keystone_time || fight.duration || 1_850_000) / 1000
    const par = dungeon?.par_time || 1800
    const bonus = mock ? 2 : (fight.keystone_bonus ?? 0)
    const diff = par - time  // > 0: under par
    const date = fight.start_time ? new Date(fight.start_time) : new Date()
    return {
        mock, level, time, par, bonus, diff,
        timed: diff >= 0,
        diff_text: `${mmss(diff)} ${diff >= 0 ? "under" : "over"}`,
        bonus_text: bonus > 0 ? `+${bonus}` : "depleted",
        date_text: date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
        time_text: date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
        total: mmss(time),
        par_text: mmss(par),
    }
}

const GOOD = "#6fd36f", BAD = "#e5604d", DIM = "#9a9a9a"
const card: React.CSSProperties = { position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200, background: "#151515", border: "1px solid #444", borderRadius: 6, boxShadow: "0 4px 14px rgba(0,0,0,.7)", padding: "8px 10px", fontSize: ".85rem", whiteSpace: "nowrap", color: "#ddd" }

/** wraps the children with a card shown on hover (position: fixed, since the bar clips overflow) */
function Hover({ card: c, children }: { card: ReactNode, children: ReactNode }) {
    const [pos, set_pos] = useState<{ x: number, y: number } | null>(null)
    return (
        <div
            style={{ display: "flex", alignItems: "stretch" }}
            onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); set_pos({ x: r.left, y: r.bottom + 4 }) }}
            onMouseLeave={() => set_pos(null)}
        >
            {children}
            {pos && <div style={{ ...card, position: "fixed", top: pos.y, left: pos.x, pointerEvents: "none" }}>{c}</div>}
        </div>
    )
}

// ---------- A: rows ----------
function CardA({ i, name }: { i: ReturnType<typeof get_info>, name?: string }) {
    const row = (k: string, v: ReactNode) => <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}><span style={{ color: DIM }}>{k}</span><span>{v}</span></div>
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 190 }}>
            <div style={{ fontWeight: 600 }}>{name} <span style={{ color: "#f5c542" }}>+{i.level}</span></div>
            {row("Result", <span style={{ color: i.timed ? GOOD : BAD }}>{i.diff_text} · {i.bonus_text}</span>)}
            {row("Duration", `${i.total} / ${i.par_text}`)}
            {row("Date", `${i.date_text}, ${i.time_text}`)}
            {i.mock && <div style={{ color: "#c77", fontSize: ".7rem" }}>(mock data: backend sent no keystone)</div>}
        </div>
    )
}

// ---------- B: scoreboard ----------
function CardB({ i, name }: { i: ReturnType<typeof get_info>, name?: string }) {
    const c = i.timed ? GOOD : BAD
    return (
        <div style={{ textAlign: "center", minWidth: 170 }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#f5c542", lineHeight: 1 }}>+{i.level}</div>
            <div style={{ color: DIM, marginBottom: 6 }}>{name}</div>
            <div style={{ fontSize: "1.1rem", color: c, fontWeight: 600 }}>{i.diff_text}</div>
            <div style={{ color: c }}>{i.bonus_text}</div>
            <div style={{ height: 6, background: "#333", borderRadius: 3, margin: "8px 0 4px", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, width: `${Math.min(100, (i.time / i.par) * 100)}%`, background: c, borderRadius: 3 }} />
                <div style={{ position: "absolute", left: "60%", top: -2, bottom: -2, width: 1, background: "#aaa" }} />
                <div style={{ position: "absolute", left: "80%", top: -2, bottom: -2, width: 1, background: "#aaa" }} />
            </div>
            <div style={{ color: DIM, fontSize: ".75rem" }}>{i.total} of {i.par_text}</div>
            <div style={{ color: DIM, fontSize: ".75rem" }}>{i.date_text} · {i.time_text}</div>
        </div>
    )
}

////////////////////////////////////////////////////////////////////////////////

/** wraps the icon (+ siblings) of `DungeonInfo`: A/B add a hover card around the icon; C leaves it alone */
export function KeystoneIcon({ fight, dungeon, children }: { fight: Fight, dungeon: Dungeon | null, children: ReactNode }) {
    const [variant] = useVariant()
    const i = get_info(fight, dungeon)
    if (variant == "A") { return <Hover card={<CardA i={i} name={dungeon?.name} />}>{children}</Hover> }
    if (variant == "B") { return <Hover card={<CardB i={i} name={dungeon?.name} />}>{children}</Hover> }
    return <>{children}</>
}

/** replaces the duration text inside the bar */
export function KeystoneBarText({ fight, dungeon, fallback }: { fight: Fight, dungeon: Dungeon | null, fallback: ReactNode }) {
    const [variant] = useVariant()
    const i = get_info(fight, dungeon)
    if (variant == "B") {
        return <span style={{ color: "#f5c542", opacity: 1, fontWeight: 600 }}>+{i.level} <span style={{ color: i.timed ? GOOD : BAD, fontWeight: 400 }}>{i.bonus_text}</span></span>
    }
    if (variant == "C") {
        return <span style={{ opacity: 1, fontSize: ".75rem", color: i.timed ? GOOD : BAD }}>+{i.level} · {i.diff_text}</span>
    }
    return <>{fallback}</>
}

/** variant C: block at the top of the pull selector popover */
export function KeystonePopoverHeader({ fight, dungeon }: { fight: Fight, dungeon: Dungeon | null }) {
    const [variant] = useVariant()
    if (variant != "C") { return null }
    const i = get_info(fight, dungeon)
    const c = i.timed ? GOOD : BAD
    const cell = (k: string, v: ReactNode, color?: string) => <div style={{ display: "flex", flexDirection: "column" }}><span style={{ color: DIM, fontSize: ".65rem", textTransform: "uppercase" }}>{k}</span><span style={{ color }}>{v}</span></div>
    return (
        <div style={{ display: "flex", gap: 18, padding: "6px 8px", background: "#222", borderRadius: 4, borderLeft: `3px solid ${c}` }}>
            {cell("Key", `+${i.level}`, "#f5c542")}
            {cell(i.timed ? "Timed" : "Depleted", i.diff_text.replace(" under", " under").replace(" over", " over") + (i.bonus > 0 ? ` ${i.bonus_text}` : ""), c)}
            {cell("Duration", i.total)}
            {cell("Date", `${i.date_text} ${i.time_text}`)}
        </div>
    )
}
