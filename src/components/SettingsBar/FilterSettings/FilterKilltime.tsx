import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/store_hooks'
import { set_filters } from '../../../store/ui'
import { FaClock } from 'react-icons/fa'
import FilterMenu, { FilterMenuHeader } from '../shared/FilterMenu'
import DurationInputGroup from "../../shared/DurationInputGroup"

import styles from "./FilterKilltime.module.scss"


/** Icon to set the min/max killtime-filter */
export default function FilterKilltimeGroup() {

    const dispatch = useAppDispatch()
    const min = useAppSelector(state => state.ui.filters.killtime.min) || undefined
    const max = useAppSelector(state => state.ui.filters.killtime.max) || undefined
    const [reset, set_reset] = useState(0)  // remounts the inputs, to clear their text

    const active = !!(min || max)

    function onChange(values: { min?: number, max?: number }) {
        dispatch(set_filters({ killtime: { min: values.min || null, max: values.max || null } }))
    }

    function clear() {
        onChange({})
        set_reset(reset + 1)
    }

    return (
        <FilterMenu
            icon={<FaClock />}
            label="Killtime"
            active={active}
            on_clear={clear}
        >
            <FilterMenuHeader title="Killtime" on_clear={active ? clear : undefined} />
            <DurationInputGroup
                key={reset}
                start_min={min}
                start_max={max}
                onChange={onChange}
                className={styles.killtime_group}
            />
        </FilterMenu>
    )
}
