import Icon from "../../components/shared/Icon"
import { get_bosses } from "../../store/bosses"
import { get_player_roles, get_role, get_specs_for_role } from "../../store/roles"
import { useAppSelector } from "../../store/store_hooks"
import type Boss from "../../types/boss"
import type Role from "../../types/role"
import type Spec from "../../types/spec"
import styles from "./AdminSpecRankingStatus.module.scss"


function Cell({ spec, boss }: { spec: Spec, boss: Boss }) {
    return (
        <td className={styles.dataCell}>
            yes
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

    return (
        <div className="p-2 bg-dark border rounded">
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
