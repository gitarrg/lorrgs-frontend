import { useEffect, useMemo, useState } from "react"
import { fetch_data } from "../../api"
import Icon from "../../components/shared/Icon"
import { get_bosses } from "../../store/bosses"
import { get_player_roles, get_role, get_specs_for_role } from "../../store/roles"
import { useAppDispatch, useAppSelector } from "../../store/store_hooks"
import type Boss from "../../types/boss"
import type Role from "../../types/role"
import type Spec from "../../types/spec"
import type { SpecRankingInfo } from "../../types/spec_ranking"
import styles from "./AdminSpecRankingStatus.module.scss"
import { get_selected_specs_ranking, set_selected_spec_ranking } from "../../store/admin"


/** Max age at which the hue reaches stale (red); linear green → red before that. */

const ONE_MINUTE = 60 * 1000
const ONE_HOUR = 60 * ONE_MINUTE
const MAX_AGE_MS = 12 * ONE_HOUR

function freshnessBackground(updated: Date): string {
    const ageMs = Math.max(0, Date.now() - updated.getTime())
    const t = Math.min(1, ageMs / MAX_AGE_MS)
    const hue = 130 * (1 - t)
    return `hsl(${hue} 42% 30%)`
}

function isFetchError(x: unknown): x is { error: string; status?: number } {
    return typeof x === "object" && x !== null && "error" in x
}

/** Compact age for the cell label (no extra deps). */
function shortAgeLabel(d: Date): string {
    const sec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
    if (sec < 60) return `${sec}s`
    const min = Math.floor(sec / 60)
    if (min < 60) return `${min}m`
    const h = Math.floor(min / 60)
    if (h < 48) return `${h}h`
    const days = Math.floor(h / 24)
    if (days < 14) return `${days}d`
    return `${Math.floor(days / 7)}w`
}


function Cell({ spec, boss }: { spec: Spec, boss: Boss }) {

    const key = `${spec.full_name_slug}-${boss.full_name_slug}`
    const selected = useAppSelector((state) => get_selected_specs_ranking(state, key))
    const dispatch = useAppDispatch()

    const [info, setInfo] = useState<SpecRankingInfo | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const url = `/api/spec_ranking/${spec.full_name_slug}/${boss.full_name_slug}/info`
        let cancelled = false

            ; (async () => {
                setLoading(true)
                const data = await fetch_data(url, { difficulty: "mythic" })
                if (cancelled) return
                if (isFetchError(data)) {
                    setInfo(null)
                } else {
                    setInfo(data as SpecRankingInfo)
                }
                setLoading(false)
            })()

        return () => {
            cancelled = true
        }
    }, [spec.full_name_slug, boss.full_name_slug])

    const updatedAt = useMemo(() => {
        if (!info?.updated) return null
        const d = new Date(info.updated)
        return Number.isNaN(d.getTime()) ? null : d
    }, [info?.updated])

    const dirty = Boolean(info?.dirty)

    const style = useMemo(() => {
        if (dirty) return undefined
        if (selected) return { background: "hsl(200 40% 50%)" }
        if (updatedAt) return { background: freshnessBackground(updatedAt) }
        return undefined
    }, [dirty, selected, updatedAt])

    const titleParts: string[] = []
    if (loading) titleParts.push("Loading…")
    else if (!info) titleParts.push("No data")
    else {
        if (updatedAt) titleParts.push(`Updated: ${updatedAt.toISOString()}`)
        else titleParts.push("No updated timestamp")
        titleParts.push(info.dirty ? "Dirty" : "Clean")
    }
    const title = titleParts.join(" · ")

    function setSelected(next: boolean) {
        dispatch(set_selected_spec_ranking({
            key,
            selected: next
        }))
    }

    let label = "…"
    if (!loading) {
        if (!info) label = "—"
        else if (updatedAt) label = shortAgeLabel(updatedAt)
        else label = "?"
    }

    return (
        <td
            data-selected={selected}
            className={dirty ? styles.cellDirty : undefined}
            style={style}
            title={title}
            onClick={() => setSelected(!selected)}
        >
            {label}
        </td>
    )
}


function SpecRow({ spec }: { spec: Spec }) {
    const bosses = useAppSelector((state) => get_bosses(state))
    const role = useAppSelector((state) => get_role(state, spec.role))

    return (
        <tr key={spec.full_name_slug}>

            <th scope="row">
                <div className={styles.specHead}>
                    <Icon spec={role} size="s" />
                    <Icon spec={spec} size="s" />
                    <span className={`wow-${spec.class.name_slug} ml-1`}>{spec.name}</span>
                </div>
            </th>

            {Object.values(bosses).map((boss: Boss) => (
                <Cell key={`${spec.full_name_slug}-${boss.full_name_slug}`} spec={spec} boss={boss} />
            ))}
        </tr>
    )
}


function RoleGroup({ role }: { role: Role }) {
    const specs = useAppSelector((state) => get_specs_for_role(state, role.code))
    return (
        <>
            {specs.map((spec) => (
                <SpecRow key={spec.full_name_slug} spec={spec} />
            ))}
        </>
    )
}


export default function AdminSpecRankingStatus() {
    const roles = useAppSelector((state) => get_player_roles(state))
    const bosses = useAppSelector((state) => get_bosses(state))

    const selected_specs_rankings = useAppSelector((state) => state.admin.selected_spec_rankings)


    function flagDirty() {
        for (const [key, value] of Object.entries(selected_specs_rankings)) {
            if (value) {
                console.log("key", key, "value", value)
            }
        }
    }


    return (
        <div className="p-2 bg-dark border rounded">

            <div className={styles.buttonGroup}>
                <input type="Button" onClick={flagDirty} value="flag dirty" />
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th></th>
                        {Object.values(bosses).map((boss: Boss) => (
                            <th key={boss.full_name_slug} title={boss.full_name} className={styles.bossHead}>
                                <Icon spec={boss} size="s" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {roles.map((role) => (
                        <RoleGroup key={role.code} role={role} />
                    ))}
                </tbody>
            </table>
        </div>
    )
}
