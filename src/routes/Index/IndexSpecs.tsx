import { Fragment } from 'react'
import { get_default_boss } from "../../store/bosses"
import { get_player_roles } from '../../store/roles'
import { get_spec } from '../../store/specs'
import { Link } from 'react-router-dom'
import { useAppSelector } from '../../store/store_hooks'
import * as styles  from "./IndexSpecs.scss"
import Icon from '../../components/shared/Icon'
import type Role from '../../types/role'


function SpecButton({spec_slug=""}) {

    const spec = useAppSelector(state => get_spec(state, spec_slug))
    const boss = useAppSelector(get_default_boss);
    if (!spec) { return null }
    if (!boss) { return null }

    return (
        <Link to={`/spec_ranking/${spec_slug}/${boss?.full_name_slug}`} data-tooltip={spec.full_name}>
            <Icon spec={spec} alt={spec.full_name} />
        </Link>
    )
}


function create_row(role: Role) {


    return (
        <Fragment key={role.code}>

            {/* Wrapped Icon+Label in one div, to better align the label */}
            <div>
                <Icon spec={role} alt={role.name} />

                <span className={styles.role_name}>
                    {role.name}
                </span>
            </div>

            <div className={styles.spec_button_container}>
                {role.specs.map(spec_slug =>
                    <SpecButton key={spec_slug} spec_slug={spec_slug} />
                )}
            </div>
        </Fragment>

    )
}


export default function IndexSpecs() {

    const roles = useAppSelector(state => get_player_roles(state))

    return (
        <div>
            <h3>Top Parses by Spec:</h3>
            <div className={`${styles.container} bg-dark rounded border p-2`}>
                {roles.map(role => create_row(role))}
            </div>
        </div>
    )
}
