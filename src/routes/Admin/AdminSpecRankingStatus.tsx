import moment from "moment"
import { Fragment, useCallback, useMemo, useState } from "react"
import { fetch_data } from "../../api"
import Icon from "../../components/shared/Icon"
import { get_bosses, get_zones } from "../../store/bosses"
import { get_player_roles } from "../../store/roles"
import { get_specs } from "../../store/specs"
import { useAppSelector } from "../../store/store_hooks"
import type Boss from "../../types/boss"
import type Role from "../../types/role"
import type Spec from "../../types/spec"

import styles from "./AdminSpecRankingStatus.module.scss"

const FETCH_CONCURRENCY = 14

function cellKey(spec_slug: string, boss_slug: string) {
    return `${spec_slug}\t${boss_slug}`
}

type CellState =
    | { kind: "empty" }
    | { kind: "loading" }
    | { kind: "missing" }
    | { kind: "error" }
    | { kind: "ok"; updated: number; dirty: boolean }

function parseUpdatedUnix(raw: unknown): number | undefined {
    if (raw == null || raw === "") {
        return undefined
    }
    if (typeof raw === "number" && Number.isFinite(raw)) {
        if (raw > 1e15) {
            return Math.floor(raw / 1000)
        }
        if (raw > 1e12) {
            return Math.floor(raw / 1000)
        }
        return Math.floor(raw)
    }
    if (typeof raw === "string") {
        if (/^\d+$/.test(raw)) {
            const n = parseInt(raw, 10)
            return n > 1e12 ? Math.floor(n / 1000) : n
        }
        const ms = Date.parse(raw)
        if (!Number.isNaN(ms)) {
            return Math.floor(ms / 1000)
        }
    }
    return undefined
}

function cellStateFromJson(data: unknown): CellState {
    if (!data || typeof data !== "object") {
        return { kind: "error" }
    }
    const o = data as Record<string, unknown>
    if ("status" in o && typeof o.status === "number") {
        if (o.status === 404) {
            return { kind: "missing" }
        }
        return { kind: "error" }
    }
    if ("error" in o) {
        return { kind: "error" }
    }
    const u = parseUpdatedUnix(o.updated)
    if (u === undefined || u < 946684800) {
        return { kind: "missing" }
    }
    return { kind: "ok", updated: u, dirty: Boolean(o.dirty) }
}


export default function AdminSpecRankingStatus() {
    const roles = useAppSelector((state) => get_player_roles(state))
    const specs_map = useAppSelector((state) => get_specs(state))
    const bosses_map = useAppSelector((state) => get_bosses(state))
    const zones = useAppSelector((state) => get_zones(state))

    const [cells, setCells] = useState<Record<string, CellState>>({})
    const [loading, setLoading] = useState(false)

    const bosses = useMemo(() => {
        const list: Boss[] = []
        for (const z of zones) {
            for (const slug of z.bosses) {
                const b = bosses_map[slug]
                if (b) {
                    list.push(b)
                }
            }
        }
        return list
    }, [zones, bosses_map])

    const specs_ordered = useMemo(() => {
        const all = Object.values(specs_map)
        const out: Spec[] = []
        for (const role of roles) {
            for (const spec of all) {
                if (spec.role === role.code) {
                    out.push(spec)
                }
            }
        }
        return out
    }, [roles, specs_map])

    const pairs = useMemo(() => {
        const p: { spec_slug: string; boss_slug: string; key: string }[] = []
        for (const spec of specs_ordered) {
            for (const boss of bosses) {
                p.push({
                    spec_slug: spec.full_name_slug,
                    boss_slug: boss.full_name_slug,
                    key: cellKey(spec.full_name_slug, boss.full_name_slug),
                })
            }
        }
        return p
    }, [specs_ordered, bosses])

    const refresh = useCallback(async () => {
        setLoading(true)
        const next: Record<string, CellState> = {}
        for (const { key } of pairs) {
            next[key] = { kind: "loading" }
        }
        setCells(next)

        for (let i = 0; i < pairs.length; i += FETCH_CONCURRENCY) {
            const chunk = pairs.slice(i, i + FETCH_CONCURRENCY)
            await Promise.all(
                chunk.map(async ({ spec_slug, boss_slug, key }) => {
                    const path = `/api/spec_ranking/${encodeURIComponent(spec_slug)}/${encodeURIComponent(boss_slug)}`
                    const data = await fetch_data(path, { difficulty: "mythic" })
                    const state = cellStateFromJson(data)
                    setCells((prev) => ({ ...prev, [key]: state }))
                }),
            )
        }
        setLoading(false)
    }, [pairs])

    function roleBlock(role: Role) {
        const specs = specs_ordered.filter((s) => s.role === role.code)
        return (
            <Fragment key={role.code}>
                {specs.map((spec) => (
                    <tr key={spec.full_name_slug}>
                        <th scope="row" className={styles.specCell}>
                            <span className={styles.specLabel}>
                                <Icon spec={role} size="s" />
                                <Icon spec={spec} size="s" />
                                <span className={`wow-${spec.class.name_slug}`}>{spec.name}</span>
                            </span>
                        </th>
                        {bosses.map((boss) => {
                            const k = cellKey(spec.full_name_slug, boss.full_name_slug)
                            const st = cells[k] ?? { kind: "empty" }
                            let text = "—"
                            let dirty = false
                            if (st.kind === "loading") {
                                text = "…"
                            } else if (st.kind === "missing") {
                                text = "—"
                            } else if (st.kind === "error") {
                                text = "?"
                            } else if (st.kind === "ok") {
                                text = moment.unix(st.updated).fromNow(true)
                                dirty = st.dirty
                            }
                            return (
                                <td
                                    key={boss.full_name_slug}
                                    className={styles.dataCell}
                                    style={dirty ? { color: "hsl(45, 100%, 62%)" } : undefined}
                                >
                                    {text}
                                </td>
                            )
                        })}
                    </tr>
                ))}
            </Fragment>
        )
    }

    return (
        <div className="p-2 bg-dark border rounded">
            <div className={styles.toolbar}>
                <button type="button" className="btn btn-sm btn-secondary" disabled={loading} onClick={() => void refresh()}>
                    Refresh
                </button>
                {loading ? <span className="text-muted small">Loading…</span> : null}
            </div>

            <div className={styles.wrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.specHead}>Spec</th>
                            {bosses.map((boss) => (
                                <th key={boss.full_name_slug} title={boss.full_name} className={styles.bossHead}>
                                    <Icon spec={boss} size="s" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>{roles.map((role) => roleBlock(role))}</tbody>
                </table>
            </div>
        </div>
    )
}
