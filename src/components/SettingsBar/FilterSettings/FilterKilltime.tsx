import { useAppDispatch } from '../../../store/store_hooks'
import { set_filters } from '../../../store/ui'
import ButtonGroup from '../shared/ButtonGroup'
import DurationInputGroup from "../../shared/DurationInputGroup"

import styles from "./FilterKilltime.module.scss"


/**
 * Group to set the min/max killtime-filter
 *
 * @returns {ReactComponent}
 */
export default function FilterKilltimeGroup() {

    const dispatch = useAppDispatch()

    // Callback when values get changed
    function onChange({min, max}: {min: number, max: number}) {
        dispatch(set_filters({killtime: {min, max}}))
    }

    // Render
    return (
        <ButtonGroup name="Killtime">
            <DurationInputGroup onChange={onChange} className={styles.killtime_group} />
        </ButtonGroup>
    )
}
