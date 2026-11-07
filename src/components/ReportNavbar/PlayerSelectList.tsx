import Icon from '../../components/shared/Icon'
import PlayerWidget from './PlayerWidget'
import SelectGrid from './SelectGrid/SelectGrid'
import type Actor from '../../types/actor'
import type Role from '../../types/role'
import { SelectGroup } from './SelectGrid/SelectGroup'
import { get_player_roles } from '../../store/roles'
import { get_shown_players } from '../../store/report_links'
import { group_by } from '../../utils'
import { useAppSelector } from '../../store/store_hooks'
import { get_specs } from '../../store/specs'
import { ASSETS } from '../../constants'


/** Group for players whose spec we don't know. */
export const UNKNOWN_ROLE: Role = {
    id: 0,
    code: "unknown",
    name: "Unknown",
    specs: [],
    metrics: [],
    playable: true,
    icon_path: `${ASSETS}/images/roles/mix.jpg`,
}


/** the players grouped by role, in role order (players of unknown specs last). Only roles with players. */
export function usePlayersByRole(players: Actor[]): [Role, Actor[]][] {
    const roles = useAppSelector(get_player_roles)
    const specs = useAppSelector(get_specs)
    const players_by_role = group_by(players, (player: Actor) => specs[player.spec_slug]?.role || UNKNOWN_ROLE.code)
    return [...roles, UNKNOWN_ROLE].filter(role => players_by_role[role.code]).map(role => [role, players_by_role[role.code]])
}


function RoleGroup({role, players} : {role: Role, players: Actor[]}) {
    players = players.sort((a, b) => a.spec_slug > b.spec_slug ? -1 : 1)

    // Render
    const icon = <Icon spec={role} size="m" className="button grow-when-touched" />
    const items = players.map(player => <PlayerWidget key={player.source_id} player={player}/>)
    return <SelectGroup icon={icon} items={items} />
}


export default function PlayerSelectList() {

    const players = useAppSelector(get_shown_players)
    const players_by_role = usePlayersByRole(players)
    if (players.length == 0) { return null }

    // Render
    return (
        <SelectGrid title="Players:">
            {players_by_role.map(([role, players]) =>
                <RoleGroup key={role.code} role={role} players={players} />
            )}
        </SelectGrid>
    )
}
