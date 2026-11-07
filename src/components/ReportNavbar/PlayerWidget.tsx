import Icon from '../../components/shared/Icon'
import SelectGridItem from "./SelectGrid/SelectGridItem"
import styles from "./PlayerWidget.module.scss"
import type Actor from '../../types/actor'
import { get_spec } from '../../store/specs'
import { useAppSelector } from '../../store/store_hooks'
import { get_class } from '../../store/classes'


const MAX_CHAR_NAME = 6;


export default function PlayerWidget({player} : {player: Actor}) {

    const field_name = `player[${player.source_id}]`
    const spec = useAppSelector(state => get_spec(state, player.spec_slug))
    const wow_class_name = player.class_slug
    const wow_class = useAppSelector(state => get_class(state, wow_class_name))
    const className = `${styles.container} wow-${wow_class_name}`

    ////////////////////////////////
    // Render
    return (
        <SelectGridItem field_name={field_name} className={className} link={{kind: "player", id: player.source_id!}}>
            <div className={styles.background}></div>
            {/* (neither is known while the specs/classes of the report's Game Version load) */}
            {(spec || wow_class) && <Icon spec={spec || wow_class} size="s" />}
            <span>{player.name.substring(0, MAX_CHAR_NAME)}</span>
        </SelectGridItem>
    )
}
