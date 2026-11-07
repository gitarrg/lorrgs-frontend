import { useEffect, useRef, useState } from "react"
import Icon from "../../shared/Icon"
import styles from "./FightPlayerLinks.module.scss"
import type Actor from "../../../types/actor"
import type Fight from "../../../types/fight"
import type Role from "../../../types/role"
import { get_pull_color, group_by, timetamp_to_time } from "../../../utils"
import { get_player_roles } from "../../../store/roles"
import { UNKNOWN_ROLE } from "../PlayerSelectList"
import { get_specs } from "../../../store/specs"
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


/** the icon of a pull's boss, or of its dungeon */
function FightIcon({ fight }: { fight: Fight }) {
    const boss = useAppSelector(state => fight.boss?.boss_slug ? state.zones.bosses[fight.boss.boss_slug] : null)
    const dungeon = useAppSelector(state => fight.dungeon ? state.dungeons[fight.dungeon] : null)
    if (boss) { return <Icon spec={boss} size="s" /> }
    if (dungeon) { return <img className="icon-s rounded" src={dungeon.icon_path} alt="" /> }
    return null
}


function useFightName(fight?: Fight) {
    return useAppSelector(state => {
        const boss_slug = fight?.boss?.boss_slug
        return boss_slug ? state.zones.bosses[boss_slug]?.full_name : state.dungeons[fight?.dungeon || ""]?.name
    }) || ""
}


/** Pull: who was in it, by role. */
function FightTooltipContent({ fight_id }: { fight_id: number }) {

    const fight = useAppSelector(get_shown_fights).find(fight => fight.fight_id == fight_id)
    const number = useAppSelector(get_fight_numbers)[fight_id]
    const player_ids = useAppSelector(get_player_ids_by_fight)[fight_id]
    const all_players = useAppSelector(get_user_report_players)
    const roles = useAppSelector(get_player_roles)
    const specs = useAppSelector(get_specs)
    const name = useFightName(fight)
    if (!fight || !player_ids) { return null }

    const players = all_players.filter(player => player_ids.has(player.source_id!))
    const players_by_role = group_by(players, (player: Actor) => specs[player.spec_slug]?.role || UNKNOWN_ROLE.code)
    const rows: [Role, Actor[]][] = [...roles, UNKNOWN_ROLE].map(role => [role, players_by_role[role.code]])

    return (
        <>
            <div className={styles.header}>
                <FightIcon fight={fight} />
                <span>{name} #{number}</span>
                <span className={styles.muted}>
                    {timetamp_to_time(fight.start_time)} · {format_result(fight)} · {players.length} players
                </span>
            </div>
            {rows.filter(([, players]) => players?.length).map(([role, players]) => (
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


/** Places the tooltip under the item, growing away from the closer screen edge. */
function get_position(hovered: LinkHover): React.CSSProperties {
    const { left, right, bottom } = hovered.anchor
    const top = bottom + 4
    if (left > window.innerWidth * 0.55) {
        return { top, right: window.innerWidth - right }
    }
    return { top, left }
}


/** The tooltip of the hovered pull/player (if enabled in the View Settings). */
export default function LinkTooltip() {

    const hovered = useAppSelector(get_hovered)
    const enabled = useAppSelector(get_view_settings).tooltip
    const [shown, set_shown] = useState<LinkHover | null>(null)
    const shown_ref = useRef(shown)
    shown_ref.current = shown

    useEffect(() => {
        if (!enabled) { set_shown(null); return }

        // already open: move along instantly
        const delay = hovered ? (shown_ref.current ? 0 : SHOW_DELAY) : HIDE_DELAY
        const timer = setTimeout(() => set_shown(hovered), delay)
        return () => clearTimeout(timer)
    }, [hovered, enabled])

    if (!shown) { return null }

    return (
        <div className={styles.tooltip} style={get_position(shown)}>
            {shown.kind == "fight"
                ? <FightTooltipContent fight_id={shown.id} />
                : <PlayerTooltipContent player_id={shown.id} />
            }
        </div>
    )
}
