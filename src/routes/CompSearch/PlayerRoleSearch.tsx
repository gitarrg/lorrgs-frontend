
import { get_player_roles } from '../../store/roles'
import { useAppSelector } from '../../store/store_hooks'
import FormGroup from './FormGroup'
import CountFilterGroup from './SearchCountInput'


/**
 * Group to search by role
 */
export default function PlayerRoleSearch() {

    const roles = useAppSelector(get_player_roles)

    return (
        <FormGroup name="Roles:" className="player-role-search">
            {roles.map(role =>
                <CountFilterGroup
                    key={role.code}
                    name={`comp.role.${role.code}`}
                    icon_path={role.icon_path}
                    class_name={role.code}
                />
            )}
        </FormGroup>
    )
}
