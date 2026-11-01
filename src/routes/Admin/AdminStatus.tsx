import { ReactNode, useEffect, useMemo, useState } from "react"
import { BiPlusMedical } from "react-icons/bi"
import { FaStar } from "react-icons/fa"
import { IoSkullSharp } from "react-icons/io5"
import { RiSwordFill } from "react-icons/ri"
import { fetch_versioned } from "../../api"
import Icon from "../../components/shared/Icon"
import { get_bosses, get_zones } from "../../store/bosses"
import { get_role } from "../../store/roles"
import { get_specs } from "../../store/specs"
import { useAppSelector } from "../../store/store_hooks"
import type Boss from "../../types/boss"
import type Spec from "../../types/spec"
import type { SpecRankingStatus } from "../../types/spec_ranking"
import styles from "./AdminStatus.module.scss"


////////////////////////////////////////////////////////////////////////////////
// Age → color
//

const ONE_HOUR = 60 * 60 * 1000

/** Age at which a ranking is considered "mid" (yellow). */
const MID_AGE_MS = 12 * ONE_HOUR
/** Age at which a ranking is considered "old" (red). */
const OLD_AGE_MS = 24 * ONE_HOUR

const COLOR_FRESH = "hsl(130 45% 32%)"
const COLOR_MID = "hsl(48 65% 38%)"
const COLOR_OLD = "hsl(0 60% 38%)"


/** fresh (green) → mid (yellow) → old (red) */
function ageColor(age_ms: number): string {
    if (age_ms >= OLD_AGE_MS) { return COLOR_OLD }
    if (age_ms >= MID_AGE_MS) {
        const t = (age_ms - MID_AGE_MS) / (OLD_AGE_MS - MID_AGE_MS)
        return `color-mix(in oklab, ${COLOR_OLD} ${t * 100}%, ${COLOR_MID})`
    }
    const t = age_ms / MID_AGE_MS
    return `color-mix(in oklab, ${COLOR_MID} ${t * 100}%, ${COLOR_FRESH})`
}


function ageLabel(age_ms: number): string {
    const min = Math.floor(age_ms / 60_000)
    if (min < 60) { return `${min}m` }
    const h = Math.floor(min / 60)
    if (h < 48) { return `${h}h` }
    const days = Math.floor(h / 24)
    if (days < 14) { return `${days}d` }
    return `${Math.floor(days / 7)}w`
}


////////////////////////////////////////////////////////////////////////////////
// Sorting: role (tank > heal > dps), then class, then spec
//

const ROLE_ORDER: { [role: string]: number } = { tank: 0, heal: 1, mdps: 2, rdps: 2 }

function sort_specs(specs: Spec[]): Spec[] {
    return specs
        .filter(spec => spec.role in ROLE_ORDER)
        .sort((a, b) =>
            ROLE_ORDER[a.role] - ROLE_ORDER[b.role]
            || a.class.name.localeCompare(b.class.name)
            || a.name.localeCompare(b.name)
        )
}


////////////////////////////////////////////////////////////////////////////////
// Status
//

/** "default" is the metric the site shows for the spec (eg.: hps for healers) */
type MetricChoice = "default" | "dps" | "bossdps" | "hps"

const METRIC_CHOICES: { value: MetricChoice, label: string, icon: ReactNode, color: string }[] = [
    { value: "default", label: "Default metric", icon: <FaStar />, color: "wow-artifact" },
    { value: "dps", label: "Damage", icon: <RiSwordFill />, color: "wow-mdps" },
    { value: "bossdps", label: "Boss DPS", icon: <IoSkullSharp />, color: "wow-boss" },
    { value: "hps", label: "Healing", icon: <BiPlusMedical />, color: "wow-heal" },
]

type Difficulty = "mythic" | "heroic"

const DIFFICULTY_CHOICES: { value: Difficulty, label: string, icon: ReactNode, color: string }[] = [
    { value: "mythic", label: "Mythic", icon: "M", color: "wow-astounding" },
    { value: "heroic", label: "Heroic", icon: "H", color: "wow-artifact" },
]


/**
 * Status of one spec × boss for the chosen metric.
 * All rankings (other metrics / difficulties) are kept for the tooltip.
 */
interface CellStatus {
    /** `null`: a ranking that is shown was never stored */
    last_refreshed: Date | null
    dirty: boolean
    /** the rankings the age and dirty flag are based on. Empty: the spec has no ranking for this metric */
    shown: SpecRankingStatus[]
    rankings: SpecRankingStatus[]
}


function build_status_map(rows: SpecRankingStatus[], metric: MetricChoice, difficulty: Difficulty): Map<string, CellStatus> {
    const grouped = new Map<string, SpecRankingStatus[]>()
    for (const row of rows) {
        const key = `${row.spec_slug}-${row.boss_slug}`
        grouped.set(key, [...(grouped.get(key) ?? []), row])
    }

    const result = new Map<string, CellStatus>()
    for (const [key, rankings] of grouped) {
        const shown = rankings.filter(r =>
            r.difficulty === difficulty && (metric === "default" ? r.is_default_metric : r.metric === metric)
        )
        const dates = shown.map(r => r.last_refreshed ? new Date(r.last_refreshed) : null)
        result.set(key, {
            // the oldest one: `null` (never stored) counts as the oldest
            last_refreshed: dates.length && !dates.includes(null) ? new Date(Math.min(...dates.map(d => d!.getTime()))) : null,
            dirty: shown.some(r => r.dirty_since),
            shown,
            rankings,
        })
    }
    return result
}


function build_title(spec: Spec, boss: Boss, status?: CellStatus): string {
    const lines = [`${spec.full_name} · ${boss.full_name}`]
    if (status?.dirty) { lines.push("DIRTY") }
    for (const r of status?.rankings ?? []) {
        const age = r.last_refreshed ? ageLabel(Date.now() - new Date(r.last_refreshed).getTime()) : "never"
        const dirty = r.dirty_since ? " (dirty)" : ""
        const shown = status!.shown.includes(r) ? " *" : ""
        lines.push(`${r.metric} / ${r.difficulty}: ${age}${dirty}${shown}`)
    }
    return lines.join("\n")
}


////////////////////////////////////////////////////////////////////////////////
// Grid
//

function Cell({ spec, boss, status }: { spec: Spec, boss: Boss, status?: CellStatus }) {

    const age_ms = status?.last_refreshed ? Math.max(0, Date.now() - status.last_refreshed.getTime()) : null
    // no ranking of this metric / difficulty for the spec (eg.: hps for a dps spec)
    const label = status && !status.shown.length ? "" : age_ms === null ? "—" : ageLabel(age_ms)

    return (
        <td
            className={status?.dirty ? styles.dirty : undefined}
            // not `background`: that would reset the hatching of `.dirty`
            style={{ backgroundColor: age_ms !== null ? ageColor(age_ms) : undefined }}
            title={build_title(spec, boss, status)}
        >
            {label}
        </td>
    )
}


function SpecHead({ spec }: { spec: Spec }) {
    const role = useAppSelector((state) => get_role(state, spec.role))
    return (
        <th scope="row">
            <div className={styles.spec_head}>
                {role && <Icon spec={role} size="s" />}
                <Icon spec={spec} size="s" />
                <span className={`wow-${spec.class.name_slug} ml-1`}>{spec.name}</span>
            </div>
        </th>
    )
}


/** Icon buttons like the ones in the spec ranking settings: dimmed unless selected. */
function ButtonStrip<T extends string>({ choices, value, onChange }: {
    choices: { value: T, label: string, icon: ReactNode, color: string }[]
    value: T
    onChange: (value: T) => void
}) {
    return (
        <div className={`${styles.button_strip} bg-dark p-1 rounded border`}>
            {choices.map(choice => (
                <div
                    key={choice.value}
                    data-tooltip={choice.label}
                    className={`${styles.button} ${choice.color} button icon-s rounded border-white${choice.value === value ? "" : " disabled"}`}
                    onClick={() => onChange(choice.value)}
                >
                    {choice.icon}
                </div>
            ))}
        </div>
    )
}


export default function AdminStatus() {

    const zones = useAppSelector(get_zones)
    const all_bosses = useAppSelector(get_bosses)
    const all_specs = useAppSelector(get_specs)

    const [rows, setRows] = useState<SpecRankingStatus[] | null>(null)
    const [metric, setMetric] = useState<MetricChoice>("default")
    const [difficulty, setDifficulty] = useState<Difficulty>("mythic")
    const [error, setError] = useState<string | null>(null)

    // one request covers every ranking of the season
    useEffect(() => {
        let cancelled = false
        fetch_versioned("/spec_ranking/status").then(data => {
            if (cancelled || data === null) { return }
            if ("error" in data) { setError(String(data.error)); return }
            setRows(data as SpecRankingStatus[])
        })
        return () => { cancelled = true }
    }, [])

    const statuses = useMemo(() => rows && build_status_map(rows, metric, difficulty), [rows, metric, difficulty])
    const specs = useMemo(() => sort_specs(Object.values(all_specs)), [all_specs])

    // all raids side by side: [zone, its bosses]
    const columns = zones
        .map(zone => ({ zone, bosses: zone.bosses.map(slug => all_bosses[slug]).filter(Boolean) }))
        .filter(({ bosses }) => bosses.length)

    if (error) { return <div className="p-2">Failed to load: {error}</div> }
    if (!statuses || !columns.length) { return <div className="p-2">Loading…</div> }

    return (
        <div className="p-2 bg-dark border rounded">
            <div className={`${styles.strips} mb-2`}>
                <ButtonStrip choices={DIFFICULTY_CHOICES} value={difficulty} onChange={setDifficulty} />
                <ButtonStrip choices={METRIC_CHOICES} value={metric} onChange={setMetric} />
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th />
                        {columns.flatMap(({ zone, bosses }) => bosses.map((boss, i) => (
                            <th
                                key={boss.full_name_slug}
                                title={boss.full_name}
                                className={`${styles.boss_head}${i === 0 ? ` ${styles.zone_start}` : ""}`}
                            >
                                <Icon spec={boss} size="s" />
                            </th>
                        )))}
                    </tr>
                </thead>
                <tbody>
                    {specs.map((spec, i) => (
                        <tr key={spec.full_name_slug} className={i > 0 && ROLE_ORDER[specs[i - 1].role] !== ROLE_ORDER[spec.role] ? styles.role_start : undefined}>
                            <SpecHead spec={spec} />
                            {columns.flatMap(({ bosses }) => bosses.map((boss, j) => (
                                <Cell
                                    key={boss.full_name_slug}
                                    spec={spec}
                                    boss={boss}
                                    status={statuses.get(`${spec.full_name_slug}-${boss.full_name_slug}`)}
                                />
                            )))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
