import Icon from '../../components/shared/Icon'
import PlayerWidget from './PlayerWidget'
import SelectGrid from './SelectGrid/SelectGrid'
import type Actor from '../../types/actor'
import type Role from '../../types/role'
import { SelectGroup } from './SelectGrid/SelectGroup'
import { get_roles } from '../../store/roles'
import { get_user_report_players } from  '../../store/user_reports'
import { group_by } from '../../utils'
import { useAppSelector } from '../../store/store_hooks'
import { get_specs } from '../../store/specs'


function RoleGroup({role, players} : {role: Role, players: Actor[]}) {
    if (!players) { return null }
    players = players.sort((a, b) => a.spec_slug > b.spec_slug ? -1 : 1)

    // Render
    const icon = <Icon spec={role} size="m" className="button grow-when-touched" />
    const items = players.map(player => <PlayerWidget key={player.source_id} player={player}/>)
    return <SelectGroup icon={icon} items={items} />
}


export default function PlayerSelectList() {

    const players = useAppSelector(get_user_report_players)
    const roles = useAppSelector(get_roles)
    const specs = useAppSelector(get_specs)
    if (players.length == 0) { return null }

    const players_by_role = group_by(players, (player: Actor) => specs[player.spec_slug]?.role || "mix")


    // Render
    return (
        <SelectGrid title="Players:">
            {Object.values(roles).map(role =>
                <RoleGroup key={role.code} role={role} players={players_by_role[role.code]} />
            )}
        </SelectGrid>
    )
}
