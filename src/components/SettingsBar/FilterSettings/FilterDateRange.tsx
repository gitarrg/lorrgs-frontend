import { useAppDispatch, useAppSelector } from '../../../store/store_hooks'

import { FaCalendarAlt } from 'react-icons/fa'
import { set_filters } from '../../../store/ui'
import FilterMenu, { FilterMenuHeader } from '../shared/FilterMenu'
import styles from './FilterDateRange.module.scss'


export default function FilterDateRangeGroup() {
    const dispatch = useAppDispatch()
    const from = useAppSelector(state => state.ui.filters.log_date.from) || ""
    const to = useAppSelector(state => state.ui.filters.log_date.to) || ""

    function update_filter(next_from: string, next_to: string) {
        dispatch(set_filters({
            log_date: {
                from: next_from || null,
                to: next_to || null,
            }
        }))
    }

    const active = !!(from || to)

    return (
        <FilterMenu
            icon={<FaCalendarAlt />}
            label="Date Range"
            active={active}
            on_clear={() => update_filter("", "")}
        >
            <FilterMenuHeader title="Date Range" on_clear={active ? () => update_filter("", "") : undefined} />
            <div className={styles.date_range_group}>
                <input
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={e => update_filter(e.target.value, to)}
                    aria-label="From date"
                    className={`form-control ${styles.date_input} ${from ? styles.is_filled : styles.is_empty}`}
                />
                <span className={styles.separator}>–</span>
                <input
                    type="date"
                    value={to}
                    min={from || undefined}
                    onChange={e => update_filter(from, e.target.value)}
                    aria-label="To date"
                    className={`form-control ${styles.date_input} ${to ? styles.is_filled : styles.is_empty}`}
                />
            </div>
        </FilterMenu>
    )
}
