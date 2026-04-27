import { useState } from 'react'
import { useDispatch } from 'react-redux'

import { set_filters } from '../../../store/ui'
import ButtonGroup from '../shared/ButtonGroup'
import styles from './FilterDateRange.module.scss'


export default function FilterDateRangeGroup() {
    const dispatch = useDispatch()
    const [from, setFrom] = useState<string>("")
    const [to, setTo] = useState<string>("")

    function update_filter(next_from: string, next_to: string) {
        dispatch(set_filters({
            log_date: {
                from: next_from || null,
                to: next_to || null,
            }
        }))
    }

    function on_change_from(value: string) {
        setFrom(value)
        update_filter(value, to)
    }

    function on_change_to(value: string) {
        setTo(value)
        update_filter(from, value)
    }

    return (
        <ButtonGroup name="Date Range">
            <div className={`d-flex gap-1 ${styles.date_range_group}`}>
                <input
                    type="date"
                    value={from}
                    onChange={e => on_change_from(e.target.value)}
                    aria-label="From date"
                    className={`form-control ${styles.date_input} ${from ? styles.is_filled : styles.is_empty}`}
                />
                <input
                    type="date"
                    value={to}
                    onChange={e => on_change_to(e.target.value)}
                    aria-label="To date"
                    className={`form-control ${styles.date_input} ${to ? styles.is_filled : styles.is_empty}`}
                />
            </div>
        </ButtonGroup>
    )
}
