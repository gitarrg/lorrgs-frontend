import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useCanSelectLinks } from "./useLinkItem"
import Icon from "../../shared/Icon"
import styles from "./FightPlayerLinks.module.scss"
import type Fight from "../../../types/fight"
import { get_pull_color, group_by, timetamp_to_time } from "../../../utils"
import { usePlayersByRole } from "../PlayerSelectList"
import { get_boss } from "../../../store/bosses"
import { get_dungeon } from "../../../store/dungeons"
import { get_user_report_players } from "../../../store/user_reports"
import { useAppSelector } from "../../../store/store_hooks"
import {
    get_fight_group,
    get_fight_ids_by_player,
    get_fight_numbers,
    get_hovered,
    get_player_ids_by_fight,
    get_shown_fights,
    get_view_settings,
    type LinkHover,
} from "../../../store/report_links"


/** wait this long on an item before its tooltip shows */
const SHOW_DELAY = 300
/** moving to the next item within this time keeps the tooltip open */
const HIDE_DELAY = 100


function format_result(fight: Fight) {
    if (fight.kill) { return "kill" }
    if (fight.dungeon) { return "in progress" }
    return `${(fight.percent || 0).toFixed(0)}%`
}


/** "#5" with a kill/wipe coloured border, plus the wipe % in its pull colour */
function PullLabel({ fight, number }: { fight: Fight, number: number }) {
    return (
        <span className={`${styles.chip} ${fight.kill ? "wow-kill" : "wow-wipe"}`}>
            <span>#{number}</span>
            {!fight.kill && !fight.dungeon && (
                <span className={`wow-${get_pull_color(fight.percent || 0)}`}> {(fight.percent || 0).toFixed(0)}%</span>
            )}
        </span>
    )
}


/** a pull's boss, or its dungeon (`get_boss` without a slug would give the selected boss) */
function useFightGroup(fight?: Fight) {
    const boss_slug = fight?.boss?.boss_slug
    const boss = useAppSelector(state => boss_slug ? get_boss(state, boss_slug) : null)
    const dungeon = useAppSelector(state => boss_slug ? null : get_dungeon(state, fight?.dungeon ?? undefined))
    return { boss, dungeon }
}


/** the icon of a pull's boss, or of its dungeon */
function FightIcon({ fight }: { fight: Fight }) {
    const { boss, dungeon } = useFightGroup(fight)
    if (boss) { return <Icon spec={boss} size="s" /> }
    if (dungeon) { return <img className="icon-s rounded" src={dungeon.icon_path} alt="" /> }
    return null
}


/** Pull: who was in it, by role. */
function FightTooltipContent({ fight_id }: { fight_id: number }) {

    const fight = useAppSelector(get_shown_fights).find(fight => fight.fight_id == fight_id)
    const number = useAppSelector(get_fight_numbers)[fight_id]
    const player_ids = useAppSelector(get_player_ids_by_fight)[fight_id]
    const all_players = useAppSelector(get_user_report_players)
    const { boss, dungeon } = useFightGroup(fight)
    const players = player_ids ? all_players.filter(player => player_ids.has(player.source_id!)) : []
    const rows = usePlayersByRole(players)
    if (!fight || !player_ids) { return null }

    const name = boss?.full_name || dungeon?.name || ""

    return (
        <>
            <div className={styles.header}>
                <FightIcon fight={fight} />
                <span>{name} #{number}</span>
                <span className={styles.muted}>
                    {timetamp_to_time(fight.start_time)} · {format_result(fight)} · {players.length} players
                </span>
            </div>
            {rows.map(([role, players]) => (
                <div key={role.code} className={styles.row}>
                    <Icon spec={role} size="s" />
                    <div className={styles.row_items}>
                        {players.map(player => (
                            <span key={player.source_id} className={`${styles.chip} wow-${player.class_slug}`}>{player.name}</span>
                        ))}
                    </div>
                </div>
            ))}
        </>
    )
}


/** Player: their pulls, by boss/dungeon. */
function PlayerTooltipContent({ player_id }: { player_id: number }) {

    const player = useAppSelector(get_user_report_players).find(player => player.source_id == player_id)
    const fight_ids = useAppSelector(get_fight_ids_by_player)[player_id]
    const shown_fights = useAppSelector(get_shown_fights)
    const numbers = useAppSelector(get_fight_numbers)
    if (!player || !fight_ids) { return null }

    const fights = shown_fights.filter(fight => fight_ids.has(fight.fight_id))
    const fights_by_group: { [group: string]: Fight[] } = group_by(fights, get_fight_group)

    return (
        <>
            <div className={styles.header}>
                <span className={`wow-${player.class_slug}`}>{player.name}</span>
                <span className={styles.muted}>{fights.length} of {shown_fights.length} pulls</span>
            </div>
            {Object.values(fights_by_group).map(group => (
                <div key={get_fight_group(group[0])} className={styles.row}>
                    <FightIcon fight={group[0]} />
                    <div className={styles.row_items}>
                        {group.map(fight => <PullLabel key={fight.fight_id} fight={fight} number={numbers[fight.fight_id]} />)}
                    </div>
                </div>
            ))}
        </>
    )
}


/** how to select an item with its links (see `useLinkItem`) */
function SelectHint({ kind }: { kind: LinkHover["kind"] }) {
    const linked = kind == "fight" ? "its players" : "their pulls"
    return (
        <div className={styles.hint}>
            Alt+click: select with {linked} · Shift+Alt+click: add to selection
        </div>
    )
}


const GAP = 4


/** Places the tooltip under the item, growing away from the closer screen edge. */
function get_position(hovered: LinkHover): React.CSSProperties {
    const { left, right, bottom } = hovered.anchor
    const top = bottom + GAP
    if (left > window.innerWidth * 0.55) {
        return { top, right: window.innerWidth - right }
    }
    return { top, left }
}


/** Moves the tooltip above the item if it doesn't fit below (once its size is known). */
function flip_if_needed(element: HTMLElement, hovered: LinkHover) {
    // (set here each time: React leaves `top` alone while its own value doesn't change)
    const { top, bottom } = hovered.anchor
    const height = element.offsetHeight
    const fits_below = bottom + GAP + height <= window.innerHeight
    element.style.top = `${fits_below ? bottom + GAP : Math.max(GAP, top - GAP - height)}px`
}


/** The tooltip of the hovered pull/player (if enabled in the View Settings). */
export default function LinkTooltip() {

    const hovered = useAppSelector(get_hovered)
    const enabled = useAppSelector(get_view_settings).tooltip
    const [shown, set_shown] = useState<LinkHover | null>(null)
    const can_select_links = useCanSelectLinks()
    const shown_ref = useRef(shown)
    shown_ref.current = shown
    const element = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!enabled) { set_shown(null); return }

        // already open: move along instantly
        const delay = hovered ? (shown_ref.current ? 0 : SHOW_DELAY) : HIDE_DELAY
        const timer = setTimeout(() => set_shown(hovered), delay)
        return () => clearTimeout(timer)
    }, [hovered, enabled])

    useLayoutEffect(() => {
        if (shown && element.current) { flip_if_needed(element.current, shown) }
    })

    // placed for where the item was: hide it when that moves
    useEffect(() => {
        if (!shown) { return }
        const hide = () => set_shown(null)
        window.addEventListener("scroll", hide, { capture: true, passive: true })
        return () => window.removeEventListener("scroll", hide, { capture: true })
    }, [shown])

    if (!shown) { return null }

    return (
        <div ref={element} className={styles.tooltip} style={get_position(shown)}>
            {shown.kind == "fight"
                ? <FightTooltipContent fight_id={shown.id} />
                : <PlayerTooltipContent player_id={shown.id} />
            }
            {can_select_links && <SelectHint kind={shown.kind} />}
        </div>
    )
}
